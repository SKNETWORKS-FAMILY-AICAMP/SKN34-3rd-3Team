"""홈 화면 지표 (모집 중 공고 수 등)."""

from core.db import scalar


def overview() -> dict:
    open_announcements = scalar(
        "SELECT count(*) FROM announcements WHERE apply_end_date >= CURRENT_DATE"
    )
    policies = scalar("SELECT count(*) FROM policies")
    tax_documents = scalar("SELECT count(*) FROM tax_documents")
    calendar_events = scalar("SELECT count(*) FROM calendar_events")
    industries = scalar(
        "SELECT count(DISTINCT NULLIF(industry, '')) FROM policies"
    )
    return {
        "openAnnouncements": open_announcements or 0,
        "policies": policies or 0,
        "taxDocuments": tax_documents or 0,
        "calendarEvents": calendar_events or 0,
        "industries": industries or 0,
        "maxReductionRate": 100,
    }
