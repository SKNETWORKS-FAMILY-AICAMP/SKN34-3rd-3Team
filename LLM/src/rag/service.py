import asyncio
from collections.abc import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langsmith import traceable, tracing_context

from src.core.config import Settings
from src.core.langsmith import configure_langsmith
from src.rag.chain import generate_answer
from src.rag.contracts import EligibilityDecision, RagAnswer, SourceCitation
from src.rag.guardrails import (
    INSUFFICIENT_EVIDENCE_ANSWER,
    preserve_decision,
    validate_question,
    validate_top_k,
)
from src.rag.retriever import RagRetriever
from src.vectorstores.base import VectorSearch


class RagService:
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

    async def answer(
        self,
        question: str,
        *,
        policy_id: int | None = None,
        top_k: int | None = None,
        decision: EligibilityDecision | None = None,
    ) -> RagAnswer:
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
            tags=["rag", "in-memory"],
            metadata={"policy_id": policy_id},
            enabled=tracing.enabled,
            client=tracing.client,
        ):
            return await self._answer_traced(
                normalized_question,
                policy_id=policy_id,
                top_k=resolved_top_k,
                decision=decision,
            )

    @traceable(name="rag_answer", run_type="chain")
    async def _answer_traced(
        self,
        question: str,
        *,
        policy_id: int | None,
        top_k: int,
        decision: EligibilityDecision | None,
    ) -> RagAnswer:
        results = await asyncio.to_thread(
            self._retriever.retrieve,
            question,
            policy_id=policy_id,
            top_k=top_k,
        )
        preserved_decision = preserve_decision(decision)
        if not results:
            return RagAnswer(
                answer=INSUFFICIENT_EVIDENCE_ANSWER,
                grounded=False,
                sources=(),
                decision=preserved_decision,
            )

        answer = await generate_answer(
            self._llm_factory(),
            question=question,
            results=results,
            decision=preserved_decision,
        )
        sources = tuple(SourceCitation.from_search_result(result) for result in results)
        return RagAnswer(
            answer=answer.strip(),
            grounded=bool(sources),
            sources=sources,
            decision=preserved_decision,
        )
