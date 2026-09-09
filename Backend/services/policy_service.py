"""지원정책 / 공고 조회 로직 (FS-18 ~ FS-23)."""

import re

from core.db import query, query_one

# 법정동 코드 앞 2자리 → 시·도명
_SIDO = {
    "11": "서울", "26": "부산", "27": "대구", "28": "인천", "29": "광주",
    "30": "대전", "31": "울산", "36": "세종", "41": "경기", "43": "충북",
    "44": "충남", "45": "전북", "46": "전남", "47": "경북", "48": "경남",
    "50": "제주", "51": "강원", "52": "전북", "12": "서울",
}

REGION_OPTIONS = ["전체", "전국", "서울", "경기", "인천", "대전", "부산", "대구",
                  "광주", "울산", "세종", "충북", "충남", "전북", "전남",
                  "경북", "경남", "강원", "제주"]


def normalize_region(value: str | None) -> str:
    """빈값 → 전국, 법정동 코드 목록 → 시·도명(들)."""
    v = (value or "").strip()
    if not v:
        return "전국"
    if not re.fullmatch(r"[\d,\s]+", v):
        return v
    sidos: list[str] = []
    for code in v.split(","):
        code = code.strip()[:2]
        name = _SIDO.get(code)
        if name and name not in sidos:
            sidos.append(name)
    if not sidos:
        return "전국"
    if len(sidos) > 3:
        return f"{sidos[0]} 외 {len(sidos) - 1}개 시·도"
    return " · ".join(sidos)


def _policy_row(r: dict) -> dict:
    return {
        "id": r["id"],
        "title": r["title"],
        "region": normalize_region(r.get("region")),
        "industry": (r.get("industry") or "").strip() or "기타",
        "target": (r.get("target") or "").strip(),
        "benefit": (r.get("benefit") or "").strip(),
        "source": r.get("source"),
    }


def search_policies(
    keyword: str | None = None,
    region: str | None = None,
    industry: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    where, params = ["1=1"], []
    if keyword:
        where.append("(p.title ILIKE %s OR p.target ILIKE %s OR p.benefit ILIKE %s)")
        like = f"%{keyword}%"
        params += [like, like, like]
    if region and region != "전체":
        # region 컬럼은 지역명 또는 법정동 코드 목록이라 부분 일치 + 빈값(전국)을 함께 본다
        where.append("(p.region ILIKE %s OR p.region = '' OR p.region IS NULL OR p.region = '전국')")
        params.append(f"%{region}%")
    if industry and industry != "전체":
        where.append("p.industry ILIKE %s")
        params.append(f"%{industry}%")

    sql_where = " AND ".join(where)
    total = query_one(f"SELECT count(*) AS c FROM policies p WHERE {sql_where}", tuple(params))["c"]
    rows = query(
        f"""
        SELECT p.id, p.title, p.region, p.industry, p.target, p.benefit, p.source
        FROM policies p
        WHERE {sql_where}
        ORDER BY p.id DESC
        LIMIT %s OFFSET %s
        """,
        tuple(params + [limit, offset]),
    )
    return {"total": total, "policies": [_policy_row(r) for r in rows]}


def get_policy(policy_id: int) -> dict | None:
    r = query_one(
        """
        SELECT p.id, p.title, p.region, p.industry, p.target, p.benefit,
               p.eligibility_rule, p.source,
               a.apply_start_date, a.apply_end_date, a.source_url
        FROM policies p
        LEFT JOIN announcements a ON a.policy_id = p.id
        WHERE p.id = %s
        ORDER BY a.apply_end_date DESC NULLS LAST
        LIMIT 1
        """,
        (policy_id,),
    )
    if not r:
        return None
    out = _policy_row(r)
    out.update(
        {
            "eligibilityRule": (r.get("eligibility_rule") or "").strip(),
            "applyStartDate": r.get("apply_start_date"),
            "applyEndDate": r.get("apply_end_date"),
            "sourceUrl": r.get("source_url") or r.get("source"),
        }
    )
    return out


def list_announcements(limit: int = 20, deadline_soon: bool = False) -> dict:
    """마감일이 남은 공고. deadline_soon 이면 임박순."""
    rows = query(
        """
        SELECT a.id, a.policy_id, a.apply_start_date, a.apply_end_date, a.source_url,
               p.title, p.region, p.industry, p.benefit, p.target,
               (a.apply_end_date - CURRENT_DATE) AS dday
        FROM announcements a
        JOIN policies p ON p.id = a.policy_id
        WHERE a.apply_end_date >= CURRENT_DATE
        ORDER BY a.apply_end_date ASC
        LIMIT %s
        """,
        (limit,),
    )
    items = []
    for r in rows:
        benefit = (r.get("benefit") or "").replace("\r", " ").replace("\n", " ").strip()
        items.append(
            {
                "id": r["id"],
                "policyId": r["policy_id"],
                "title": r["title"],
                "region": normalize_region(r.get("region")),
                "industry": (r.get("industry") or "").strip() or "기타",
                "target": (r.get("target") or "").strip()[:60],
                "benefit": benefit[:80],
                "applyStartDate": r.get("apply_start_date"),
                "applyEndDate": r.get("apply_end_date"),
                "dday": r.get("dday"),
                "sourceUrl": r.get("source_url"),
            }
        )
    return {"announcements": items}


def recommendations(region: str | None = None, industry: str | None = None, limit: int = 5) -> dict:
    """사용자 조건 기반 단순 매칭 추천 (FS-19). 마감 남은 공고 중 가점 순."""
    rows = query(
        """
        SELECT a.id, a.policy_id, a.apply_end_date, a.source_url,
               p.title, p.region, p.industry, p.benefit, p.target,
               (a.apply_end_date - CURRENT_DATE) AS dday
        FROM announcements a
        JOIN policies p ON p.id = a.policy_id
        WHERE a.apply_end_date >= CURRENT_DATE
        ORDER BY a.apply_end_date ASC
        LIMIT 400
        """
    )
    scored = []
    for r in rows:
        score, why = 40, []
        reg = normalize_region(r.get("region"))
        ind = (r.get("industry") or "").strip()
        blob = f"{r.get('title') or ''} {r.get('target') or ''}"
        if region and reg and region[:2] in reg:
            score += 30
            why.append(f"{region} 지역 사업")
        elif reg == "전국":
            score += 16
            why.append("전국 대상")
        if industry and ind and (industry[:2] in ind or ind in industry):
            score += 18
            why.append(f"{ind} 분야")
        if any(k in blob for k in ("청년", "예비창업", "초기창업")):
            score += 16
            why.append("청년·초기창업 대상")
        d = r.get("dday")
        if d is not None and d <= 30:
            score += 10
            why.append(f"마감 D-{d}")
        scored.append(
            {
                "id": r["id"],
                "policyId": r["policy_id"],
                "title": r["title"],
                "region": reg,
                "industry": ind or "기타",
                "benefit": (r.get("benefit") or "").replace("\r", " ").strip()[:80],
                "applyEndDate": r.get("apply_end_date"),
                "dday": d,
                "sourceUrl": r.get("source_url"),
                "score": min(99, score),
                "why": why[:4],
            }
        )
    scored.sort(key=lambda x: (-x["score"], x["dday"] if x["dday"] is not None else 999))
    return {"policies": scored[:limit]}
