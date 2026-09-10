from fastapi import APIRouter, Depends, Query

from api.deps import get_current_user, get_optional_user
from schemas.calendar import CalendarCreateRequest, CalendarCreateResponse, CalendarResponse
from services import calendar_service

router = APIRouter(prefix="/calendar", tags=["캘린더"])


@router.get("/upcoming", response_model=CalendarResponse, summary="오늘부터의 다가오는 일정")
def upcoming(
    limit: int = Query(default=10, ge=1, le=50, description="가져올 건수"),
    current: dict | None = Depends(get_optional_user),
):
    """오늘 포함, 마감이 가까운 순으로 N건만 반환합니다.

    로그인하지 않으면 세금·정책 마감만 보입니다. 개인 일정은 로그인한 본인 것만 포함됩니다.
    """
    user_id = current["id"] if current else None
    return {"events": calendar_service.list_upcoming(user_id, limit)}


@router.get("", response_model=CalendarResponse, summary="홈 화면 통합 캘린더")
def calendar(
    year: int | None = Query(default=None, description="연도"),
    month: int | None = Query(default=None, description="월 (1~12)"),
    type: str | None = Query(default=None, description="일정 종류: tax, policy, user"),
    current: dict | None = Depends(get_optional_user),
):
    """세금·정책 마감일은 로그인 없이 조회할 수 있습니다.

    내가 등록한 개인 일정(`eventType=USER`)은 로그인한 본인에게만 보입니다.
    """
    user_id = current["id"] if current else None
    return {"events": calendar_service.list_events(year, month, type, user_id)}


@router.post("", response_model=CalendarCreateResponse, summary="내 일정 등록")
def create_event(body: CalendarCreateRequest, current: dict = Depends(get_current_user)):
    event = calendar_service.create_personal_event(
        current["id"],
        body.title,
        body.dueDate,
        body.description,
        body.remind,
        body.notifyAt,
    )
    return {"event": event}


@router.delete("/{event_id}", summary="내 일정 삭제")
def delete_event(event_id: int, current: dict = Depends(get_current_user)):
    calendar_service.delete_personal_event(current["id"], event_id)
    return {"deleted": True}
