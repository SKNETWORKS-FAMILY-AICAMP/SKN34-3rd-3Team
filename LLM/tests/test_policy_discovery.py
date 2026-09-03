import asyncio

from langchain_core.language_models.fake_chat_models import FakeListChatModel

from src.core.config import Settings
from src.data import get_rag_chunks, get_user_profile
from src.rag.discovery import PolicyDiscoveryService
from src.rag.guardrails import INSUFFICIENT_EVIDENCE_ANSWER
from src.rag.query_builder import build_personalized_query


class CapturingVectorSearch:
    def __init__(self, results: list[dict]) -> None:
        self.results = results
        self.query = ""
        self.policy_id: int | None = -1

    def add_chunks(self, _chunks: list) -> list[str]:
        return []

    def search(
        self,
        query: str,
        *,
        policy_id: int | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        self.query = query
        self.policy_id = policy_id
        return self.results[:top_k]


def settings() -> Settings:
    return Settings(
        _env_file=None,
        langsmith_tracing=False,
        min_relevance_score=0.0,
    )


def search_result(chunk_index: int, score: float) -> dict:
    result = get_rag_chunks()[chunk_index].copy()
    result["score"] = score
    return result


def test_personalized_query_contains_available_user_profile() -> None:
    query = build_personalized_query("받을 수 있는 지원이 있어?", get_user_profile(1))

    assert "받을 수 있는 지원이 있어?" in query
    assert "나이 29세" in query
    assert "지역 서울" in query
    assert "업종 음식점업" in query


def test_personalized_query_skips_missing_values() -> None:
    query = build_personalized_query("관련 정책을 알려줘", get_user_profile(3))

    assert "None" not in query
    assert "지역 서울" in query
    assert "업종 서비스업" in query


def test_discovery_searches_all_documents_and_groups_policies() -> None:
    vector_search = CapturingVectorSearch(
        [search_result(0, 0.9), search_result(2, 0.8)]
    )
    service = PolicyDiscoveryService(
        vector_search=vector_search,
        llm_factory=lambda: FakeListChatModel(
            responses=["사용자 조건과 관련된 정책 요약입니다. [출처 1] [출처 2]"]
        ),
        settings=settings(),
    )

    result = asyncio.run(
        service.discover(
            "내 조건과 관련된 지원정책을 알려줘",
            user=get_user_profile(1),
            top_k=5,
        )
    )

    assert vector_search.policy_id is None
    assert "지역 서울" in vector_search.query
    assert result.user_id == 1
    assert result.grounded is True
    assert {policy.policy_id for policy in result.policies} == {101, 102}
    assert all(policy.sources for policy in result.policies)


def test_discovery_without_results_does_not_create_llm() -> None:
    vector_search = CapturingVectorSearch([])
    llm_factory_calls = 0

    def llm_factory() -> FakeListChatModel:
        nonlocal llm_factory_calls
        llm_factory_calls += 1
        return FakeListChatModel(responses=["호출되면 안 됨"])

    service = PolicyDiscoveryService(
        vector_search=vector_search,
        llm_factory=llm_factory,
        settings=settings(),
    )

    result = asyncio.run(
        service.discover(
            "관련 없는 질문",
            user=get_user_profile(1),
        )
    )

    assert result.answer == INSUFFICIENT_EVIDENCE_ANSWER
    assert result.grounded is False
    assert result.policies == ()
    assert llm_factory_calls == 0
