from copy import deepcopy

from src.data.contracts import EligibilityResult, Policy, RagChunk, UserProfile


class MockDataNotFoundError(LookupError):
    """Raised when a requested fixture does not exist in the Mock layer."""


_USERS: dict[int, UserProfile] = {
    1: {
        "user_id": 1,
        "age": 29,
        "region": "서울",
        "business": {
            "industry": "음식점업",
            "business_type": "개인사업자",
            "founded_at": "2026-01-01",
        },
    },
    2: {
        "user_id": 2,
        "age": 34,
        "region": "부산",
        "business": {
            "industry": "제조업",
            "business_type": "개인사업자",
            "founded_at": "2024-03-15",
        },
    },
    3: {
        "user_id": 3,
        "age": None,
        "region": "서울",
        "business": {
            "industry": "서비스업",
            "business_type": "개인사업자",
            "founded_at": None,
        },
    },
}

_POLICIES: dict[int, Policy] = {
    101: {
        "policy_id": 101,
        "title": "청년창업 지원사업",
        "region": "서울",
        "industry": ["음식점업", "서비스업"],
        "apply_start_date": "2026-09-01",
        "apply_end_date": "2026-09-30",
    },
}

_ELIGIBILITY_RESULTS: dict[tuple[int, int], EligibilityResult] = {
    (1, 101): {
        "question": "나는 이 정책 대상이야?",
        "policy_id": 101,
        "eligible": True,
        "reasons": [
            "연령 조건 충족",
            "지역 조건 충족",
            "업종 조건 충족",
        ],
    },
    (2, 101): {
        "question": "나는 이 정책 대상이야?",
        "policy_id": 101,
        "eligible": False,
        "reasons": [
            "지역 조건 미충족",
            "업종 조건 미충족",
        ],
    },
    (3, 101): {
        "question": "정보가 부족해도 대상 여부를 확인할 수 있어?",
        "policy_id": 101,
        "eligible": False,
        "reasons": [
            "연령 정보 누락",
            "창업일 정보 누락",
        ],
    },
}

_RAG_CHUNKS: list[RagChunk] = [
    {
        "chunk_id": "policy-101-chunk-001",
        "policy_id": 101,
        "title": "청년창업 지원사업 테스트 문서",
        "source": "mock://policies/101",
        "page": 1,
        "content": (
            "이 테스트 정책은 서울 지역의 청년 창업자를 지원 대상으로 하며 "
            "신청자의 연령과 사업장 소재지를 확인한다."
        ),
    },
    {
        "chunk_id": "policy-101-chunk-002",
        "policy_id": 101,
        "title": "청년창업 지원사업 테스트 문서",
        "source": "mock://policies/101",
        "page": 2,
        "content": (
            "지원 업종에는 음식점업과 서비스업이 포함되며 신청 기간은 "
            "2026년 9월 1일부터 9월 30일까지이다."
        ),
    },
    {
        "chunk_id": "policy-102-chunk-001",
        "policy_id": 102,
        "title": "청년 주거이전비 지원사업 테스트 문서",
        "source": "mock://policies/102",
        "page": 1,
        "content": (
            "이 테스트 정책은 이사한 청년의 주거 이전 비용 일부를 지원한다."
        ),
    },
]


def get_user_profile(user_id: int) -> UserProfile:
    """Return a JSON-compatible copy of a Mock user profile."""
    try:
        return deepcopy(_USERS[user_id])
    except KeyError as exc:
        raise MockDataNotFoundError(f"Mock user not found: {user_id}") from exc


def get_policy(policy_id: int) -> Policy:
    """Return a JSON-compatible copy of a Mock policy."""
    try:
        return deepcopy(_POLICIES[policy_id])
    except KeyError as exc:
        raise MockDataNotFoundError(f"Mock policy not found: {policy_id}") from exc


def get_eligibility_result(user_id: int, policy_id: int) -> EligibilityResult:
    """Return a precomputed result; this function performs no eligibility logic."""
    key = (user_id, policy_id)
    try:
        return deepcopy(_ELIGIBILITY_RESULTS[key])
    except KeyError as exc:
        raise MockDataNotFoundError(
            f"Mock eligibility result not found: user={user_id}, policy={policy_id}"
        ) from exc


def get_rag_chunks(policy_id: int | None = None) -> list[RagChunk]:
    """Return Mock RAG chunks, optionally limited to one policy."""
    chunks = (
        _RAG_CHUNKS
        if policy_id is None
        else [chunk for chunk in _RAG_CHUNKS if chunk["policy_id"] == policy_id]
    )
    return deepcopy(chunks)
