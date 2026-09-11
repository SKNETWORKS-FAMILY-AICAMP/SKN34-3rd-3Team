import asyncio
from typing import Any

import pytest

from src.core.config import Settings
from src.data.contracts import RagChunk, VectorSearchResult
from src.rag.graph import (
    ContextualizedQuestion,
    GraphState,
    RouteDecision,
    build_graph,
)
from src.rag.reranker import CohereRerankError
from src.rag.roadmap import RoadmapCoachResult, compact_roadmap_history
from src.rag.answer import UnifiedAnswerResult
from src.rag.tax import TaxEvidenceDecision, TaxIntentDecision, TaxNextQuery
from src.vectorstores.hybrid import HybridSearch
from tests.fakes import FakeStructuredChatModel


CHUNKS: list[RagChunk] = [
    {
        "chunk_id": "policy-1-chunk-1",
        "policy_id": 1,
        "title": "예비창업 지원",
        "source": "db://policies/1",
        "page": 1,
        "content": "예비창업자의 사업화 자금과 창업 교육을 지원합니다.",
    },
    {
        "chunk_id": "policy-2-chunk-1",
        "policy_id": 2,
        "title": "청년 사업 지원",
        "source": "db://policies/2",
        "page": 1,
        "content": "청년 사업자를 위한 정책 자금 지원 조건입니다.",
    },
]


class TrackingDenseSearch:
    def __init__(self) -> None:
        self.call_count = 0

    def add_chunks(self, chunks: list[RagChunk]) -> list[str]:
        return [chunk["chunk_id"] for chunk in chunks]

    def search(
        self,
        _query: str,
        *,
        policy_id: int | None = None,
        top_k: int = 5,
    ) -> list[VectorSearchResult]:
        self.call_count += 1
        return [
            {**chunk, "score": 0.9 - index * 0.1}
            for index, chunk in enumerate(CHUNKS)
            if policy_id is None or chunk["policy_id"] == policy_id
        ][:top_k]

    def get_chunks(self) -> list[RagChunk]:
        return list(CHUNKS)


class EmptyHybridSearch:
    def search_stages(
        self,
        _query: str,
        *,
        policy_id: int | None,
        top_k: int,
    ) -> tuple[
        list[VectorSearchResult],
        list[VectorSearchResult],
        list[VectorSearchResult],
    ]:
        return [], [], []


def _router_llm(route: str, *, personalized: bool = False) -> Any:
    return FakeStructuredChatModel(
        {
            RouteDecision: {
                "route": route,
                "personalized": personalized,
            },
            TaxIntentDecision: {
                "calculation_required": False,
                "calculation_type": None,
                "reason": "법률 설명 질문",
            },
            UnifiedAnswerResult: {
                "answer": "확인된 문서 기반 답변",
                "status": "success",
                "cited_source_numbers": [1],
            },
        }
    )


def _hybrid_search(dense: TrackingDenseSearch) -> HybridSearch:
    return HybridSearch(
        dense_search=dense,
        chunks=CHUNKS,
        dense_candidate_k=3,
        bm25_candidate_k=3,
        rrf_k=60,
    )


@pytest.mark.parametrize(
    ("query", "route", "personalized"),
    [
        ("청년 창업 지원 정책에는 어떤 게 있어?", "policy", False),
        ("지금 신청 가능한 청년 창업 지원사업 있어?", "notice", False),
        ("청년창업 세액감면이 뭐야?", "tax", False),
        ("내가 청년창업 세액감면 받을 수 있어?", "tax", True),
    ],
)
def test_router_uses_structured_output(
    query: str,
    route: str,
    personalized: bool,
) -> None:
    result = asyncio.run(
        build_graph(_router_llm(route, personalized=personalized)).ainvoke(
            {"query": query}
        )
    )

    assert result["route"] == route
    assert result["personalized"] is personalized


@pytest.mark.parametrize(
    ("category", "proposed_route", "expected_route"),
    [
        ("tax", "policy", "tax"),
        ("expense", "notice", "tax"),
        ("saving", "notice", "tax"),
        ("saving", "policy", "policy"),
        ("policy", "tax", "policy"),
        ("policy", "notice", "notice"),
    ],
)
def test_backend_category_limits_graph_route(
    category: str,
    proposed_route: str,
    expected_route: str,
) -> None:
    result = asyncio.run(
        build_graph(_router_llm(proposed_route)).ainvoke(
            {
                "query": "청년 창업 세금 절세 또는 지원 정책 질문",
                "category": category,
            }
        )
    )

    assert result["route"] == expected_route


def test_out_of_scope_question_skips_router_and_returns_guardrail() -> None:
    model = FakeStructuredChatModel({})
    settings = Settings(
        _env_file=None,
        out_of_scope_answer="지원하지 않는 질문입니다.",
    )

    result = asyncio.run(
        build_graph(model, settings=settings).ainvoke(
            {"query": "오늘 날씨 알려줘", "category": "policy"}
        )
    )

    assert model.call_count == 0
    assert result["route"] == "policy"
    assert result["guardrail_reason"] == "out_of_scope"
    assert result["answer_status"] == "no_result"
    assert result["answer"] == "지원하지 않는 질문입니다."


def test_roadmap_branch_uses_one_model_call_and_skips_existing_pipeline() -> None:
    model = FakeStructuredChatModel(
        {
            RoadmapCoachResult: {
                "in_scope": True,
                "redirect": "none",
                "answer": "현재 C단계에서는 공고 선별과 PSST 초안을 먼저 준비하세요.",
            }
        }
    )
    dense = TrackingDenseSearch()
    contextualizer_calls = 0

    async def contextualizer(_state: GraphState) -> ContextualizedQuestion:
        nonlocal contextualizer_calls
        contextualizer_calls += 1
        return ContextualizedQuestion(standalone_question="호출되면 안 됨")

    result = asyncio.run(
        build_graph(
            model,
            policy_search=_hybrid_search(dense),
            question_contextualizer=contextualizer,
            rerank=lambda *_args: (_ for _ in ()).throw(
                AssertionError("rerank must not run")
            ),
        ).ainvoke(
            {
                "query": "이 단계에서 무엇부터 준비할까요?",
                "category": "roadmap",
                "roadmap_step": "C",
                "user_context": {
                    "user_id": 1,
                    "age": 28,
                    "region": "서울",
                    "business": {
                        "industry": "소프트웨어",
                        "business_type": "개인사업자",
                        "founded_at": "2024-01-10",
                    },
                },
                "conversation_history": [
                    {"role": "user", "content": "처음 질문"},
                    {"role": "assistant", "content": "처음 답변"},
                ],
            }
        )
    )

    assert model.call_count == 1
    assert contextualizer_calls == 0
    assert dense.call_count == 0
    assert result["route"] == "roadmap"
    assert result["answer_status"] == "success"
    assert result["answer_sources"] == []
    assert result["personalized"] is True
    assert "현재 단계: C" in model.last_prompt_text
    assert "업종=소프트웨어" in model.last_prompt_text
    assert "처음 질문" in model.last_prompt_text
    assert "Z 스케일업" in model.last_prompt_text


def test_roadmap_result_truncates_long_answer_and_normalizes_redirect() -> None:
    result = RoadmapCoachResult(
        in_scope=True,
        redirect="tax",
        answer="가" * 900,
    )

    assert result.redirect == "none"
    assert len(result.answer) == 500


def test_roadmap_obvious_blocked_keyword_skips_model_call() -> None:
    model = FakeStructuredChatModel({})

    result = asyncio.run(
        build_graph(model).ainvoke(
            {"query": "오늘 서울 날씨 알려줘", "category": "roadmap"}
        )
    )

    assert model.call_count == 0
    assert result["answer_status"] == "no_result"
    assert result["guardrail_reason"] == "out_of_scope"


def test_roadmap_context_prevents_keyword_false_positive() -> None:
    model = FakeStructuredChatModel(
        {
            RoadmapCoachResult: {
                "in_scope": True,
                "redirect": "none",
                "answer": "게임 개발 창업도 같은 아이디어 검증 순서로 준비하세요.",
            }
        }
    )

    result = asyncio.run(
        build_graph(model).ainvoke(
            {"query": "게임 개발 창업은 무엇부터 준비해?", "category": "roadmap"}
        )
    )

    assert model.call_count == 1
    assert result["answer_status"] == "success"


@pytest.mark.parametrize(
    ("redirect", "expected_answer"),
    [
        ("tax", "이 질문은 AI 세무 Assistant에서 확인해 주세요."),
        ("policy", "이 질문은 공고지원 AI에서 확인해 주세요."),
        ("none", "창업 로드맵 단계와 준비 작업에 관한 질문만 답변할 수 있습니다."),
    ],
)
def test_roadmap_guardrail_discards_model_answer(
    redirect: str,
    expected_answer: str,
) -> None:
    model = FakeStructuredChatModel(
        {
            RoadmapCoachResult: {
                "in_scope": False,
                "redirect": redirect,
                "answer": "모델이 생성했지만 사용자에게 노출되면 안 되는 답변",
            }
        }
    )

    result = asyncio.run(
        build_graph(model).ainvoke(
            {"query": "범위 밖 질문", "category": "roadmap"}
        )
    )

    assert model.call_count == 1
    assert result["answer"] == expected_answer
    assert result["answer_status"] == "no_result"
    assert result["guardrail_reason"] == "out_of_scope"
    assert result["answer_sources"] == []


def test_roadmap_model_failure_is_fail_closed_without_second_call() -> None:
    model = FakeStructuredChatModel({})

    result = asyncio.run(
        build_graph(model).ainvoke(
            {"query": "사업계획서는 어떻게 준비해?", "category": "roadmap"}
        )
    )

    assert model.call_count == 1
    assert result["route"] == "roadmap"
    assert result["answer_status"] == "error"
    assert result["answer"] == "요청을 처리하는 중 오류가 발생했습니다."
    assert result["answer_sources"] == []


def test_roadmap_history_keeps_latest_five_pairs() -> None:
    history = [
        message
        for index in range(7)
        for message in (
            {"role": "user", "content": f"질문-{index}"},
            {"role": "assistant", "content": f"답변-{index}"},
        )
    ]

    compacted = compact_roadmap_history(history)

    assert len(compacted) == 10
    assert compacted[0]["content"] == "질문-2"
    assert compacted[-1]["content"] == "답변-6"


def test_roadmap_history_drops_oldest_pairs_to_fit_character_limit() -> None:
    history = [
        message
        for index in range(7)
        for message in (
            {"role": "user", "content": f"질문-{index}-" + "가" * 500},
            {"role": "assistant", "content": f"답변-{index}-" + "나" * 500},
        )
    ]

    compacted = compact_roadmap_history(history)

    assert len(compacted) == 6
    assert compacted[0]["content"].startswith("질문-4-")
    assert compacted[-1]["content"].startswith("답변-6-")
    assert sum(len(message["content"]) for message in compacted) <= 4000


def test_graph_without_history_skips_question_contextualizer() -> None:
    calls = 0

    async def contextualizer(_state: GraphState) -> ContextualizedQuestion:
        nonlocal calls
        calls += 1
        return ContextualizedQuestion(standalone_question="사용되면 안 됨")

    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            question_contextualizer=contextualizer,
        ).ainvoke({"query": "청년 창업 지원 정책 알려줘"})
    )

    assert calls == 0
    assert result["standalone_query"] == "청년 창업 지원 정책 알려줘"


def test_contextualized_question_drives_router_guardrail_and_policy_search() -> None:
    queries: list[str] = []

    class QueryTrackingSearch:
        def search_stages(
            self,
            query: str,
            *,
            policy_id: int | None,
            top_k: int,
        ) -> tuple[
            list[VectorSearchResult],
            list[VectorSearchResult],
            list[VectorSearchResult],
        ]:
            queries.append(query)
            documents = [{**CHUNKS[0], "score": 0.9}]
            return documents, documents, documents

    async def contextualizer(_state: GraphState) -> ContextualizedQuestion:
        return ContextualizedQuestion(
            standalone_question="월급 320만원이고 공제대상 가족이 두 명일 때 세금"
        )

    model = _router_llm("policy")
    result = asyncio.run(
        build_graph(
            model,
            policy_search=QueryTrackingSearch(),  # type: ignore[arg-type]
            rerank=lambda _query, documents, _top_n: documents,
            question_contextualizer=contextualizer,
        ).ainvoke(
            {
                "query": "가족이 두 명이면?",
                "category": "policy",
                "conversation_history": [
                    {"role": "user", "content": "월급은 320만원이야"},
                    {"role": "assistant", "content": "가족 수를 알려주세요."},
                ],
            }
        )
    )

    assert result["standalone_query"] == (
        "월급 320만원이고 공제대상 가족이 두 명일 때 세금"
    )
    assert queries == [result["standalone_query"]]
    assert "가족이 두 명일 때" in model.last_prompt_text


def test_contextualizer_failure_falls_back_to_original_question() -> None:
    async def contextualizer(_state: GraphState) -> ContextualizedQuestion:
        raise RuntimeError("contextualizer unavailable")

    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            question_contextualizer=contextualizer,
        ).ainvoke(
            {
                "query": "청년 창업 지원 정책 알려줘",
                "conversation_history": [
                    {"role": "user", "content": "이전 질문"},
                    {"role": "assistant", "content": "이전 답변"},
                ],
            }
        )
    )

    assert result["standalone_query"] == "청년 창업 지원 정책 알려줘"
    assert result["route"] == "policy"


@pytest.mark.parametrize(
    "query",
    [
        "청년 창업 지원 정책에는 어떤 게 있어?",
        "예비창업자가 받을 수 있는 지원 정책 조건 알려줘.",
    ],
)
def test_policy_route_runs_hybrid_and_rerank(query: str) -> None:
    dense = TrackingDenseSearch()
    rerank_calls: list[list[str]] = []

    def fake_rerank(
        _query: str,
        documents: list[VectorSearchResult],
        top_n: int,
    ) -> list[VectorSearchResult]:
        rerank_calls.append([document["chunk_id"] for document in documents])
        return list(reversed(documents))[:top_n]

    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            policy_search=_hybrid_search(dense),
            rerank=fake_rerank,
            settings=Settings(
                _env_file=None,
                default_top_k=2,
                cohere_rerank_candidate_k=3,
            ),
        ).ainvoke({"query": query})
    )

    assert dense.call_count == 1
    assert result["retrieved_docs"]
    assert result["reranked_docs"]
    assert rerank_calls
    assert result["reranked_docs"][0]["chunk_id"] == rerank_calls[0][-1]
    assert result["reranked_docs"][0]["source"]
    assert result["answer"] == "확인된 문서 기반 답변"
    assert result["answer_status"] == "success"
    assert result["answer_sources"]


@pytest.mark.parametrize(
    "query",
    [
        "지금 신청 가능한 청년 창업 지원사업 있어?",
        "서울에서 지금 모집 중인 창업 지원사업 알려줘.",
    ],
)
def test_notice_route_uses_only_injected_backend_interface(query: str) -> None:
    dense = TrackingDenseSearch()
    received_queries: list[str] = []

    def fake_notice_search(state: GraphState) -> list[dict[str, object]]:
        received_queries.append(state["query"])
        return [{"id": 7, "title": "현재 모집 공고"}]

    result = asyncio.run(
        build_graph(
            _router_llm("notice"),
            policy_search=_hybrid_search(dense),
            notice_search=fake_notice_search,
        ).ainvoke({"query": query})
    )

    assert dense.call_count == 0
    assert received_queries == [query]
    assert result["notice_results"] == [{"id": 7, "title": "현재 모집 공고"}]
    assert result["retrieved_docs"] == []
    assert result["answer_status"] == "success"


def test_tax_route_reports_unavailable_retriever() -> None:
    result = asyncio.run(
        build_graph(_router_llm("tax")).ainvoke(
            {"query": "청년창업 세액감면이 뭐야?"}
        )
    )

    assert result["termination_reason"] == "tax_retriever_unavailable"
    assert result["evidence_sufficient"] is False
    assert result["retrieved_docs"] == []


def test_policy_route_falls_back_to_rrf_when_cohere_fails() -> None:
    def failing_rerank(
        _query: str,
        _documents: list[VectorSearchResult],
        _top_n: int,
    ) -> list[VectorSearchResult]:
        raise CohereRerankError("temporary failure")

    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            policy_search=_hybrid_search(TrackingDenseSearch()),
            rerank=failing_rerank,
            settings=Settings(_env_file=None, default_top_k=1),
        ).ainvoke({"query": "청년 정책"})
    )

    assert result["retrieved_docs"]
    assert result["reranked_docs"] == result["retrieved_docs"][:1]


def test_notice_without_backend_returns_integration_unavailable() -> None:
    result = asyncio.run(
        build_graph(_router_llm("notice")).ainvoke(
            {"query": "서울에서 현재 모집 중인 사업 알려줘"}
        )
    )

    assert result["notice_results"] == []
    assert result["answer_status"] == "integration_unavailable"
    assert result["answer_sources"] == []


def test_policy_no_result_reaches_unified_answer_without_inventing_policy() -> None:
    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            policy_search=EmptyHybridSearch(),  # type: ignore[arg-type]
        ).ainvoke({"query": "존재하지 않는 정책"})
    )

    assert result["reranked_docs"] == []
    assert result["answer_sources"] == []
    assert result["answer_status"] == "no_result"


def test_policy_branch_does_not_call_notice_or_tax() -> None:
    notice_calls = 0

    def notice_search(_state: GraphState) -> list[dict[str, object]]:
        nonlocal notice_calls
        notice_calls += 1
        return []

    class TaxSearchThatMustNotRun:
        def search_stages(self, *_args: object, **_kwargs: object) -> object:
            raise AssertionError("Tax retrieval must not run")

    result = asyncio.run(
        build_graph(
            _router_llm("policy"),
            policy_search=_hybrid_search(TrackingDenseSearch()),
            tax_search=TaxSearchThatMustNotRun(),  # type: ignore[arg-type]
            notice_search=notice_search,
            rerank=lambda _query, documents, top_n: documents[:top_n],
        ).ainvoke({"query": "청년 창업 지원 정책 알려줘"})
    )

    assert notice_calls == 0
    assert result["answer_status"] == "success"


def test_notice_empty_result_is_no_result() -> None:
    result = asyncio.run(
        build_graph(
            _router_llm("notice"),
            notice_search=lambda _state: [],
        ).ainvoke({"query": "현재 모집 공고"})
    )

    assert result["notice_backend_available"] is True
    assert result["answer_status"] == "no_result"


def test_notice_backend_error_is_not_exposed() -> None:
    def failing_notice(_state: GraphState) -> list[dict[str, object]]:
        raise ConnectionError("sensitive backend detail")

    result = asyncio.run(
        build_graph(
            _router_llm("notice"),
            notice_search=failing_notice,
        ).ainvoke({"query": "현재 모집 공고"})
    )

    assert result["answer_status"] == "error"
    assert "sensitive" not in result["answer"]
