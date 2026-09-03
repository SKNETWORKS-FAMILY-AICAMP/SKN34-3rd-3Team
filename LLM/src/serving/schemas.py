from typing import Literal

from pydantic import BaseModel


ComponentState = Literal["configured", "not_configured", "mock", "in_memory"]


class ComponentConfiguration(BaseModel):
    llm: ComponentState
    embedding: ComponentState
    data_source: ComponentState


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str
    version: str
    components: ComponentConfiguration


class EligibilityDecisionRequest(BaseModel):
    eligible: bool
    reasons: list[str]


class RagAnswerRequest(BaseModel):
    question: str
    policy_id: int | None = None
    top_k: int | None = None
    decision: EligibilityDecisionRequest | None = None


class SourceResponse(BaseModel):
    chunk_id: str
    policy_id: int
    title: str
    source: str
    page: int
    excerpt: str
    score: float


class RagAnswerResponse(BaseModel):
    answer: str
    grounded: bool
    sources: list[SourceResponse]
    decision: EligibilityDecisionRequest | None = None


class PolicyRecommendationRequest(BaseModel):
    user_id: int
    question: str
    top_k: int | None = None


class MatchedPolicyResponse(BaseModel):
    policy_id: int
    title: str
    sources: list[SourceResponse]


class PolicyRecommendationResponse(BaseModel):
    user_id: int
    answer: str
    grounded: bool
    policies: list[MatchedPolicyResponse]


class IndexRequest(BaseModel):
    force: bool = False


class IndexResponse(BaseModel):
    status: Literal["ready", "already_ready"]
    source: Literal["cache", "embedding"]
    document_count: int
    chunk_count: int


class ReadyResponse(BaseModel):
    status: Literal["ready", "not_ready"]
    index_ready: bool
    llm_configured: bool
    embedding_configured: bool
    langsmith_tracing: bool
    document_count: int
    chunk_count: int
    index_source: Literal["cache", "embedding"] | None
