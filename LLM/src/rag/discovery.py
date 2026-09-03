import asyncio
from collections.abc import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langsmith import traceable, tracing_context

from src.core.config import Settings
from src.core.langsmith import configure_langsmith
from src.data.contracts import UserProfile, VectorSearchResult
from src.rag.chain import generate_policy_summary
from src.rag.contracts import MatchedPolicy, PolicyDiscoveryAnswer, SourceCitation
from src.rag.guardrails import (
    INSUFFICIENT_EVIDENCE_ANSWER,
    validate_question,
    validate_top_k,
)
from src.rag.query_builder import build_personalized_query
from src.rag.retriever import RagRetriever
from src.vectorstores.base import VectorSearch


class PolicyDiscoveryService:
    """Find relevant policies using profile context without judging eligibility."""

    def __init__(
        self,
        *,
        vector_search: VectorSearch,
        llm_factory: Callable[[], BaseChatModel],
        settings: Settings,
    ) -> None:
        self._retriever = RagRetriever(
            vector_search,
            min_score=settings.min_relevance_score,
        )
        self._llm_factory = llm_factory
        self._settings = settings

    async def discover(
        self,
        question: str,
        *,
        user: UserProfile,
        top_k: int | None = None,
    ) -> PolicyDiscoveryAnswer:
        normalized_question = validate_question(
            question,
            max_length=self._settings.max_question_length,
        )
        resolved_top_k = validate_top_k(
            top_k if top_k is not None else self._settings.default_top_k
        )
        tracing = configure_langsmith(self._settings)

        with tracing_context(
            project_name=tracing.project_name,
            tags=["rag", "policy-discovery", "in-memory"],
            metadata={"flow": "personalized-policy-discovery"},
            enabled=tracing.enabled,
            client=tracing.client,
        ):
            return await self._discover_traced(
                normalized_question,
                user=user,
                top_k=resolved_top_k,
            )

    @traceable(name="policy_discovery", run_type="chain")
    async def _discover_traced(
        self,
        question: str,
        *,
        user: UserProfile,
        top_k: int,
    ) -> PolicyDiscoveryAnswer:
        search_query = build_personalized_query(question, user)
        results = await asyncio.to_thread(
            self._retriever.retrieve,
            search_query,
            policy_id=None,
            top_k=top_k,
        )
        if not results:
            return PolicyDiscoveryAnswer(
                user_id=user["user_id"],
                answer=INSUFFICIENT_EVIDENCE_ANSWER,
                grounded=False,
                policies=(),
            )

        answer = await generate_policy_summary(
            self._llm_factory(),
            question=question,
            user=user,
            results=results,
        )
        return PolicyDiscoveryAnswer(
            user_id=user["user_id"],
            answer=answer.strip(),
            grounded=True,
            policies=_group_policies(results),
        )


def _group_policies(results: list[VectorSearchResult]) -> tuple[MatchedPolicy, ...]:
    grouped: dict[int, list[VectorSearchResult]] = {}
    for result in results:
        grouped.setdefault(result["policy_id"], []).append(result)

    return tuple(
        MatchedPolicy(
            policy_id=policy_id,
            title=policy_results[0]["title"],
            sources=tuple(
                SourceCitation.from_search_result(result) for result in policy_results
            ),
        )
        for policy_id, policy_results in grouped.items()
    )
