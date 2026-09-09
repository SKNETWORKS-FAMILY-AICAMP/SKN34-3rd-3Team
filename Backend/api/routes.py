"""Controller 계층 — 요청 수신 / 검증 후 Service 호출."""

from fastapi import APIRouter, HTTPException, Query

from schemas.models import ChatRequest, TaxCheckRequest
from services import (
    calendar_service,
    chat_service,
    policy_service,
    stats_service,
    tax_service,
)

router = APIRouter()


# ---------- stats ----------
@router.get("/stats")
def get_stats():
    return stats_service.overview()


# ---------- policies (FS-18 ~ FS-21) ----------
@router.get("/policies")
def get_policies(
    keyword: str | None = None,
    region: str | None = None,
    industry: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return policy_service.search_policies(keyword, region, industry, limit, offset)


@router.get("/policies/recommendations")
def get_recommendations(
    region: str | None = None,
    industry: str | None = None,
    limit: int = Query(5, ge=1, le=20),
):
    return policy_service.recommendations(region, industry, limit)


@router.get("/policies/{policy_id}")
def get_policy(policy_id: int):
    policy = policy_service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="policy not found")
    return policy


# ---------- announcements (FS-21, FS-22) ----------
@router.get("/announcements")
def get_announcements(
    limit: int = Query(20, ge=1, le=100),
    deadline: str | None = None,  # 'soon'
):
    return policy_service.list_announcements(limit=limit, deadline_soon=deadline == "soon")


# ---------- calendar (FS-11) ----------
@router.get("/calendar")
def get_calendar(
    year: int | None = None,
    month: int | None = None,
    type: str | None = None,
    limit: int = Query(300, ge=1, le=1000),
):
    return calendar_service.get_events(year, month, type, limit)


@router.get("/calendar/upcoming")
def get_calendar_upcoming(limit: int = Query(5, ge=1, le=20)):
    return calendar_service.upcoming(limit)


# ---------- tax (FS-06, FS-08, FS-13) ----------
@router.post("/tax/tax-reduction/check")
def post_tax_reduction(body: TaxCheckRequest):
    return tax_service.check_reduction(body.region, body.age, body.industry)


@router.get("/tax/documents")
def get_tax_documents(q: str, limit: int = Query(5, ge=1, le=20)):
    return tax_service.search_documents(q, limit)


@router.get("/tax/schedule")
def get_tax_schedule(limit: int = Query(12, ge=1, le=50)):
    return tax_service.schedule(limit)


# ---------- chat (FS-05 ~ FS-08) ----------
@router.post("/chat/messages")
def post_chat(body: ChatRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    return chat_service.ask(body.question, body.category)
