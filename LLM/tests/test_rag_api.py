from collections.abc import Callable
from pathlib import Path

from fastapi.testclient import TestClient
from langchain_core.embeddings import DeterministicFakeEmbedding
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from src.core.config import Settings, get_settings
from src.data import get_document_catalog
from src.serving.app import create_app
from src.serving.rag_routes import RagRuntime
from src.rag.graph import RouteDecision
from src.rag.answer import UnifiedAnswerResult
from src.vectorstores.hybrid import HybridSearch
from tests.fakes import FakeStructuredChatModel, make_default_fake_model


def build_client(
    cache_path: Path,
    *,
    embedding_factory: Callable = lambda: DeterministicFakeEmbedding(size=32),
    llm_factory: Callable = make_default_fake_model,
    retrieval_mode: str = "dense",
) -> TestClient:
    runtime = RagRuntime(
        embedding_factory=embedding_factory,
        llm_factory=llm_factory,
    )
    app = create_app(runtime=runtime)
    settings = Settings(
        _env_file=None,
        langsmith_tracing=False,
        vector_store_backend="in_memory",
        retrieval_mode=retrieval_mode,
        min_relevance_score=0.0,
        chunk_size=500,
        chunk_overlap=50,
        embedding_model="test-embedding-model",
        vector_index_cache_path=cache_path,
    )
    app.dependency_overrides[get_settings] = lambda: settings
    return TestClient(app)


def test_index_uses_hybrid_search_when_configured(tmp_path: Path) -> None:
    client = build_client(
        tmp_path / "index.json",
        retrieval_mode="hybrid",
    )

    response = client.post("/internal/rag/index")

    assert response.status_code == 200
    assert isinstance(client.app.state.rag_runtime.require_index(), HybridSearch)


def test_backend_adapter_ready_and_reindex_paths(tmp_path: Path) -> None:
    client = build_client(tmp_path / "index.json")

    before = client.get("/rag/ready")
    indexed = client.post("/rag/reindex", json={"documentIds": []})
    after = client.get("/rag/ready")

    assert before.status_code == 200
    assert before.json()["index_ready"] is False
    assert indexed.status_code == 200
    assert indexed.json()["status"] == "ready"
    assert after.json()["index_ready"] is True


def test_backend_adapter_policy_chat_returns_backend_source_contract(
    tmp_path: Path,
) -> None:
    client = build_client(tmp_path / "index.json", retrieval_mode="hybrid")
    client.post("/rag/reindex", json={})

    response = client.post(
        "/rag/chat",
        json={
            "category": "policy",
            "question": "예비창업 지원 정책 알려줘",
            "userContext": {
                "userId": 1,
                "age": 29,
                "region": "서울",
                "businessType": "간이과세자",
                "industry": "소프트웨어",
                "foundedAt": "2024-03-01",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["route"] == "policy"
    assert body["status"] == "success"
    assert body["grounded"] is True
    assert body["sources"]
    assert body["sources"][0]["url"] == body["sources"][0]["source"]


def test_backend_adapter_notice_uses_only_supplied_results(tmp_path: Path) -> None:
    model = FakeStructuredChatModel(
        {
            RouteDecision: {"route": "notice", "personalized": False},
            UnifiedAnswerResult: {
                "answer": "현재 신청 가능한 공고입니다.",
                "status": "success",
                "cited_source_numbers": [1],
            },
        }
    )
    client = build_client(
        tmp_path / "index.json",
        llm_factory=lambda: model,
    )

    response = client.post(
        "/rag/chat",
        json={
            "category": "policy",
            "question": "서울에서 지금 신청 가능한 사업 있어?",
            "noticeResults": [
                {
                    "id": 7,
                    "title": "서울 청년창업 공고",
                    "sourceUrl": "https://example.com/notices/7",
                    "benefit": "사업화 지원",
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["route"] == "notice"
    assert body["sources"] == [
        {
            "title": "서울 청년창업 공고",
            "url": "https://example.com/notices/7",
            "source": "https://example.com/notices/7",
            "excerpt": "사업화 지원",
        }
    ]


def test_backend_adapter_missing_notice_payload_is_unavailable(
    tmp_path: Path,
) -> None:
    client = build_client(
        tmp_path / "index.json",
        llm_factory=lambda: FakeStructuredChatModel(
            {RouteDecision: {"route": "notice", "personalized": False}}
        ),
    )

    response = client.post(
        "/rag/chat",
        json={
            "category": "policy",
            "question": "지금 신청 가능한 사업 있어?",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "integration_unavailable"


def test_policy_answer_without_index_reports_integration_unavailable(
    tmp_path: Path,
) -> None:
    client = build_client(tmp_path / "index.json")

    response = client.post(
        "/internal/rag/answer",
        json={"question": "지원 대상은 누구야?", "policy_id": 101},
    )

    assert response.status_code == 200
    assert response.json()["route"] == "policy"
    assert response.json()["status"] == "integration_unavailable"


def test_notice_answer_does_not_require_rag_index(tmp_path: Path) -> None:
    client = build_client(
        tmp_path / "index.json",
        llm_factory=lambda: FakeStructuredChatModel(
            {RouteDecision: {"route": "notice", "personalized": False}}
        ),
    )

    response = client.post(
        "/internal/rag/answer",
        json={"question": "지금 신청 가능한 창업 지원사업 있어?"},
    )

    assert response.status_code == 200
    assert response.json()["route"] == "notice"
    assert response.json()["status"] == "integration_unavailable"
    assert response.json()["sources"] == []


def test_index_ready_and_answer_flow_with_fake_models(tmp_path: Path) -> None:
    client = build_client(tmp_path / "index.json")

    index_response = client.post("/internal/rag/index")
    duplicate_response = client.post("/internal/rag/index")
    ready_response = client.get("/internal/rag/ready")
    answer_response = client.post(
        "/internal/rag/answer",
        json={
            "question": "초기창업 지원사업의 지원 대상은 누구야?",
            "policy_id": 101,
            "top_k": 2,
            "decision": {
                "eligible": True,
                "reasons": ["연령 조건 충족", "지역 조건 충족"],
            },
        },
    )

    assert index_response.status_code == 200
    index_body = index_response.json()
    assert index_body["status"] == "ready"
    assert index_body["source"] == "embedding"
    assert index_body["document_count"] == len(get_document_catalog())
    assert index_body["chunk_count"] > 0
    assert duplicate_response.json()["status"] == "already_ready"
    assert ready_response.json()["index_ready"] is True
    assert answer_response.status_code == 200
    body = answer_response.json()
    assert body["grounded"] is True
    assert body["route"] == "policy"
    assert body["status"] == "success"
    assert body["sources"]
    assert all(source["policy_id"] == 101 for source in body["sources"])
    assert body["decision"] == {
        "eligible": True,
        "reasons": ["연령 조건 충족", "지역 조건 충족"],
    }


def test_new_server_runtime_loads_local_cache_without_reindexing(
    tmp_path: Path,
) -> None:
    cache_path = tmp_path / "index.json"
    first_client = build_client(cache_path)
    assert first_client.post("/internal/rag/index").json()["source"] == "embedding"

    restarted_client = build_client(cache_path)
    response = restarted_client.post("/internal/rag/index")

    assert response.status_code == 200
    assert response.json()["source"] == "cache"


def test_health_does_not_create_embedding_or_llm(tmp_path: Path) -> None:
    calls = {"embedding": 0, "llm": 0}

    def embedding_factory() -> DeterministicFakeEmbedding:
        calls["embedding"] += 1
        return DeterministicFakeEmbedding(size=16)

    def llm_factory() -> FakeListChatModel:
        calls["llm"] += 1
        return FakeListChatModel(responses=["호출되면 안 됨"])

    client = build_client(
        tmp_path / "index.json",
        embedding_factory=embedding_factory,
        llm_factory=llm_factory,
    )

    response = client.get("/health")

    assert response.status_code == 200
    assert calls == {"embedding": 0, "llm": 0}


def test_personalized_policy_recommendation_uses_user_id_not_policy_input(
    tmp_path: Path,
) -> None:
    client = build_client(tmp_path / "index.json")
    client.post("/internal/rag/index")

    response = client.post(
        "/internal/rag/recommendations",
        json={
            "user_id": 1,
            "question": "내 조건과 관련된 지원정책을 알려줘",
            "top_k": 5,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == 1
    assert body["grounded"] is True
    assert body["policies"]
    assert all(policy["sources"] for policy in body["policies"])


def test_unknown_mock_user_returns_not_found(tmp_path: Path) -> None:
    client = build_client(tmp_path / "index.json")
    client.post("/internal/rag/index")

    response = client.post(
        "/internal/rag/recommendations",
        json={"user_id": 999, "question": "관련 정책을 알려줘"},
    )

    assert response.status_code == 404
    assert "Mock user not found" in response.json()["detail"]


def test_unrelated_question_returns_guardrail_answer(tmp_path: Path) -> None:
    client = build_client(tmp_path / "index.json")
    client.post("/internal/rag/index")

    response = client.post(
        "/internal/rag/recommendations",
        json={"user_id": 1, "question": "오늘 날씨가 어때?"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "user_id": 1,
        "answer": "그 질문에는 답변할 수 없습니다",
        "grounded": False,
        "policies": [],
        "guardrail_reason": "out_of_scope",
    }


def test_mixed_domain_question_returns_guardrail_answer(tmp_path: Path) -> None:
    client = build_client(tmp_path / "index.json")
    client.post("/internal/rag/index")

    response = client.post(
        "/internal/rag/recommendations",
        json={
            "user_id": 1,
            "question": "나와 관련된 정책 알려줘 그리고 파이썬 append에 관해 알려줘",
        },
    )

    assert response.status_code == 200
    assert response.json()["answer"] == "그 질문에는 답변할 수 없습니다"
    assert response.json()["policies"] == []
    assert response.json()["guardrail_reason"] == "out_of_scope"
