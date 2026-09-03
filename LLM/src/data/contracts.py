from typing import TypedDict


class BusinessProfile(TypedDict):
    industry: str | None
    business_type: str | None
    founded_at: str | None


class UserProfile(TypedDict):
    user_id: int
    age: int | None
    region: str | None
    business: BusinessProfile


class Policy(TypedDict):
    policy_id: int
    title: str
    region: str
    industry: list[str]
    apply_start_date: str
    apply_end_date: str


class EligibilityResult(TypedDict):
    question: str
    policy_id: int
    eligible: bool
    reasons: list[str]


class RagChunk(TypedDict):
    chunk_id: str
    policy_id: int
    title: str
    source: str
    page: int
    content: str


class VectorSearchResult(RagChunk):
    score: float


class DocumentCatalogEntry(TypedDict):
    policy_id: int
    title: str
    file_name: str
