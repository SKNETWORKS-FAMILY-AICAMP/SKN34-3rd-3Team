"""세무: 청년창업 세액감면 Rule Engine (FS-13) + 세법 조문 검색 (FS-06/FS-08)."""

from core.db import query

# 수도권 과밀억제권역 (조특법 제6조 판정용 단순화 목록)
METRO_CONCENTRATED = ("서울", "인천", "의정부", "구리", "남양주", "하남", "고양", "수원",
                      "성남", "안양", "부천", "광명", "과천", "의왕", "군포", "시흥")

# 창업중소기업 세액감면 제외 업종 키워드 (단순화)
EXCLUDED_INDUSTRY = ("부동산", "금융", "보험", "주점", "무도", "유흥", "사행")


def _legal_basis(limit: int = 3) -> list[dict]:
    rows = query(
        """
        SELECT id, law_name, title, left(content, 400) AS excerpt, source
        FROM tax_documents
        WHERE title ILIKE %s
        ORDER BY CASE law_name
                   WHEN '조세특례제한법' THEN 1
                   WHEN '조세특례제한법 시행령' THEN 2
                   ELSE 3 END, id
        LIMIT %s
        """,
        ("%창업중소기업 등에 대한 세액감면%", limit),
    )
    return [
        {
            "id": r["id"],
            "lawName": r["law_name"],
            "title": r["title"],
            "excerpt": (r["excerpt"] or "").strip(),
            "url": r.get("source"),
        }
        for r in rows
    ]


def check_reduction(region: str = "", age: int | None = None, industry: str = "") -> dict:
    """지역·나이·업종으로 창업중소기업 세액감면 대상 여부를 판정한다."""
    region = (region or "").strip()
    industry = (industry or "").strip()

    in_metro = any(k in region for k in METRO_CONCENTRATED)
    is_youth = age is not None and 15 <= age <= 34
    excluded = any(k in industry for k in EXCLUDED_INDUSTRY)

    reasons: list[str] = []
    if excluded:
        rate, years = 0, 0
        reasons.append(f"'{industry}' 은(는) 창업중소기업 세액감면 제외 업종에 해당할 수 있습니다.")
    elif is_youth and not in_metro:
        rate, years = 100, 5
        reasons += [
            f"창업 당시 만 {age}세 → 청년 창업(만 15~34세) 요건 충족",
            f"{region or '사업장 소재지'} 는 수도권 과밀억제권역 밖 → 100% 감면 구간",
        ]
    elif is_youth and in_metro:
        rate, years = 50, 5
        reasons += [
            f"창업 당시 만 {age}세 → 청년 창업 요건 충족",
            f"{region} 는 수도권 과밀억제권역 안 → 50% 감면 구간",
        ]
    elif not is_youth and not in_metro:
        rate, years = 50, 5
        reasons += [
            "청년(만 15~34세) 요건은 미충족",
            f"{region or '사업장 소재지'} 는 수도권 과밀억제권역 밖 → 50% 감면 구간",
        ]
    else:
        rate, years = 0, 0
        reasons += [
            "청년 요건 미충족 + 수도권 과밀억제권역 내 창업",
            "일반적으로 창업중소기업 세액감면 대상이 아닙니다(연 수입금액 등 별도 요건 확인 필요).",
        ]

    if rate > 0:
        reasons.append(
            f"최초로 소득이 발생한 과세연도부터 {years}년간 소득세·법인세 {rate}% 감면 "
            "(종합소득세 신고 시 「세액감면신청서」 동시 제출 필요)"
        )

    return {
        "eligible": rate > 0,
        "rate": rate,
        "years": years,
        "reasons": reasons,
        "legalBasis": _legal_basis(),
        "disclaimer": "참고용 판정입니다. 최종 적용 여부는 관할 세무서·세무대리인 확인이 필요합니다.",
    }


def search_documents(q: str, limit: int = 5) -> dict:
    """세법 조문 키워드 검색 — RAG 의 검색(Retrieval) 단계."""
    if not q or not q.strip():
        return {"documents": []}
    like = f"%{q.strip()}%"
    rows = query(
        """
        SELECT id, law_name, title, left(content, 600) AS excerpt, source
        FROM tax_documents
        WHERE title ILIKE %s OR content ILIKE %s
        ORDER BY
          CASE WHEN title ILIKE %s THEN 0 ELSE 1 END,
          length(content) ASC
        LIMIT %s
        """,
        (like, like, like, limit),
    )
    return {
        "documents": [
            {
                "id": r["id"],
                "lawName": r["law_name"],
                "title": r["title"],
                "excerpt": (r["excerpt"] or "").strip(),
                "url": r.get("source"),
            }
            for r in rows
        ]
    }


def schedule(limit: int = 12) -> dict:
    """세금 신고 일정 (calendar_events 의 TAX 타입)."""
    rows = query(
        """
        SELECT id, title, due_date, business_type, (due_date - CURRENT_DATE) AS dday
        FROM calendar_events
        WHERE event_type = 'TAX' AND due_date >= CURRENT_DATE
        ORDER BY due_date ASC
        LIMIT %s
        """,
        (limit,),
    )
    return {
        "events": [
            {
                "id": r["id"],
                "title": r["title"],
                "date": r["due_date"].isoformat() if r["due_date"] else None,
                "dday": r["dday"],
                "businessType": (r.get("business_type") or "").strip(),
            }
            for r in rows
        ]
    }
