from src.data.contracts import VectorSearchResult
from src.rag.contracts import EligibilityDecision


INSUFFICIENT_EVIDENCE_ANSWER = (
    "제공된 공식 문서에서 질문에 답할 충분한 근거를 찾지 못했습니다. "
    "질문을 구체화하거나 관련 정책을 선택해 주세요."
)


class RagInputError(ValueError):
    """Raised when a RAG request violates an input guardrail."""


def validate_question(question: str, *, max_length: int) -> str:
    normalized = question.strip()
    if not normalized:
        raise RagInputError("question must not be blank")
    if len(normalized) > max_length:
        raise RagInputError(f"question must not exceed {max_length} characters")
    return normalized


def validate_top_k(top_k: int) -> int:
    if not 1 <= top_k <= 20:
        raise RagInputError("top_k must be between 1 and 20")
    return top_k


def keep_grounded_results(
    results: list[VectorSearchResult],
    *,
    policy_id: int | None,
    min_score: float,
) -> list[VectorSearchResult]:
    return [
        result
        for result in results
        if result["score"] >= min_score
        and (policy_id is None or result["policy_id"] == policy_id)
    ]


def preserve_decision(
    decision: EligibilityDecision | None,
) -> EligibilityDecision | None:
    """Return the immutable Backend decision without recalculation or mutation."""
    return decision
