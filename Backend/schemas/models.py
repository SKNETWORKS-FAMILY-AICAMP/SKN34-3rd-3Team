"""Model 계층 — 요청/응답 스키마 (Pydantic)."""

from pydantic import BaseModel, Field


class TaxCheckRequest(BaseModel):
    region: str = Field("", description="사업장 소재지 (예: 대전광역시)")
    age: int | None = Field(None, description="창업 당시 대표자 나이")
    industry: str = Field("", description="업종 (예: 정보통신업)")


class ChatRequest(BaseModel):
    question: str
    category: str = Field("tax", description="tax | expense | saving | policy")
