"""홈 화면 통합 일정 캘린더 (FS-11)."""

from core.db import query


def get_events(
    year: int | None = None,
    month: int | None = None,
    event_type: str | None = None,
    limit: int = 300,
) -> dict:
    where, params = ["1=1"], []
    if year:
        where.append("EXTRACT(YEAR FROM c.due_date) = %s")
        params.append(year)
    if month:
        where.append("EXTRACT(MONTH FROM c.due_date) = %s")
        params.append(month)
    if event_type and event_type.upper() in ("TAX", "POLICY"):
        where.append("c.event_type = %s")
        params.append(event_type.upper())

    rows = query(
        f"""
        SELECT c.id, c.event_type, c.business_type, c.policy_id, c.title,
               c.due_date, c.description,
               (c.due_date - CURRENT_DATE) AS dday
        FROM calendar_events c
        WHERE {' AND '.join(where)}
        ORDER BY c.due_date ASC
        LIMIT %s
        """,
        tuple(params + [limit]),
    )
    return {
        "events": [
            {
                "id": r["id"],
                "type": (r["event_type"] or "").lower(),  # tax | policy
                "title": r["title"],
                "date": r["due_date"].isoformat() if r["due_date"] else None,
                "dday": r["dday"],
                "note": (r.get("description") or "").strip()
                or (r.get("business_type") or "").strip()
                or ("세금 신고" if r["event_type"] == "TAX" else "지원사업 마감"),
                "policyId": r.get("policy_id"),
            }
            for r in rows
        ]
    }


def upcoming(limit: int = 5) -> dict:
    """다가오는 일정 (오늘 이후)."""
    rows = query(
        """
        SELECT c.id, c.event_type, c.title, c.due_date,
               (c.due_date - CURRENT_DATE) AS dday
        FROM calendar_events c
        WHERE c.due_date >= CURRENT_DATE
        ORDER BY c.due_date ASC
        LIMIT %s
        """,
        (limit,),
    )
    return {
        "events": [
            {
                "id": r["id"],
                "type": (r["event_type"] or "").lower(),
                "title": r["title"],
                "date": r["due_date"].isoformat() if r["due_date"] else None,
                "dday": r["dday"],
            }
            for r in rows
        ]
    }
