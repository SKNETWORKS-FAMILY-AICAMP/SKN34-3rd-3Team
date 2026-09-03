from dataclasses import dataclass

from src.data.contracts import VectorSearchResult


@dataclass(frozen=True, slots=True)
class EligibilityDecision:
    eligible: bool
    reasons: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class SourceCitation:
    chunk_id: str
    policy_id: int
    title: str
    source: str
    page: int
    excerpt: str
    score: float

    @classmethod
    def from_search_result(cls, result: VectorSearchResult) -> "SourceCitation":
        excerpt = " ".join(result["content"].split())[:500]
        return cls(
            chunk_id=result["chunk_id"],
            policy_id=result["policy_id"],
            title=result["title"],
            source=result["source"],
            page=result["page"],
            excerpt=excerpt,
            score=result["score"],
        )


@dataclass(frozen=True, slots=True)
class RagAnswer:
    answer: str
    grounded: bool
    sources: tuple[SourceCitation, ...]
    decision: EligibilityDecision | None = None


@dataclass(frozen=True, slots=True)
class MatchedPolicy:
    policy_id: int
    title: str
    sources: tuple[SourceCitation, ...]


@dataclass(frozen=True, slots=True)
class PolicyDiscoveryAnswer:
    user_id: int
    answer: str
    grounded: bool
    policies: tuple[MatchedPolicy, ...]
