from datetime import date

from fastapi import HTTPException

from core import repo
from core.llm_client import summarize_announcement


def _announcement_of(policy_id: int, cache: dict[int, dict] | None = None) -> dict | None:
    if cache is not None:
        return cache.get(policy_id)
    return repo.announcement_of(policy_id)


def _to_item(
    policy: dict,
    *,
    match_score: int | None = None,
    eligible: bool | None = None,
    announcements: dict[int, dict] | None = None,
) -> dict:
    announcement = _announcement_of(policy["id"], announcements)
    return {
        "policyId": policy["id"],
        "title": policy["title"],
        "region": policy["region"],
        "industry": policy["industry"],
        "target": policy["target"],
        "benefit": policy["benefit"],
        "source": policy["source"],
        "applyEndDate": announcement["apply_end_date"] if announcement else None,
        "matchScore": match_score,
        "eligible": eligible,
    }


def _to_item_for_user(
    policy: dict,
    user_id: int | None,
    announcements: dict[int, dict] | None = None,
    user: dict | None = None,
    profile: dict | None = None,
) -> dict:
    if not user_id:
        return _to_item(policy, announcements=announcements)
    user = user if user is not None else repo.get_user(user_id) or {}
    profile = profile if profile is not None else repo.get_profile(user_id) or {}
    score, ok, _ = _score_policy(policy, user, profile, announcements)
    return _to_item(policy, match_score=score, eligible=ok, announcements=announcements)


def search(keyword: str | None, region: str | None, industry: str | None, user_id: int | None = None) -> list[dict]:
    rows = repo.list_policies()
    announcements = repo.announcement_map()
    user = repo.get_user(user_id) if user_id else None
    profile = repo.get_profile(user_id) if user_id else None
    if keyword:
        rows = [p for p in rows if keyword in (p.get("title") or "") or keyword in (p.get("benefit") or "")]
    if region:
        rows = [p for p in rows if (p.get("region") or "") in (region, "전국") or region in (p.get("region") or "")]
    if industry:
        rows = [p for p in rows if (p.get("industry") or "") in (industry, "전 업종") or industry in (p.get("industry") or "")]
    items = [_to_item_for_user(p, user_id, announcements, user, profile) for p in rows]
    items.sort(key=lambda item: (item.get("eligible") or False, item.get("matchScore") or 0), reverse=True)
    return items


def _years_since(founded: date | None) -> float | None:
    if not founded:
        return None
    return (date.today() - founded).days / 365


def _match_rule(rule: str, user: dict, profile: dict) -> tuple[bool, list[str]]:
    reasons = []
    ok = True
    age = user.get("age")
    region = user.get("region")
    founded_years = _years_since(profile.get("founded_at"))
    for token in (rule or "").split(","):
        token = token.strip()
        if token.startswith("age<=") and age is not None:
            limit = int(token.split("=")[1])
            hit = age <= limit
            ok = ok and hit
            reasons.append(f"나이 {age}세 / 요건 {token}: {'충족' if hit else '미충족'}")
        elif token.startswith("region=") and region:
            need = token.split("=", 1)[1]
            hit = region == need
            ok = ok and hit
            reasons.append(f"지역 {region} / 요건 {need}: {'충족' if hit else '미충족'}")
        elif token.startswith("founded_years<=") and founded_years is not None:
            limit = float(token.split("=")[1])
            hit = founded_years <= limit
            ok = ok and hit
            reasons.append(f"업력 {founded_years:.1f}년 / 요건 {token}: {'충족' if hit else '미충족'}")
        elif token.startswith("business_type!="):
            banned = token.split("!=", 1)[1]
            current = profile.get("business_type") or "미등록"
            hit = current != banned
            ok = ok and hit
            reasons.append(f"사업자 유형 {current}: {'충족' if hit else '미충족'}")
    if not reasons:
        reasons.append("상세 프로필이 부족해 참고용으로만 표시합니다.")
    return ok, reasons


def _score_policy(
    policy: dict,
    user: dict,
    profile: dict,
    announcements: dict[int, dict] | None = None,
) -> tuple[int, bool, list[str]]:
    ok, reasons = _match_rule(policy.get("eligibility_rule") or "", user, profile)
    score = 20 if ok else 0
    region = user.get("region")
    industry = profile.get("industry")
    if policy.get("region") in (region, "전국") or not region:
        score += 30
    if policy.get("industry") in (industry, "전 업종") or not industry:
        score += 25
    announcement = _announcement_of(policy["id"], announcements)
    if announcement and announcement.get("apply_end_date"):
        remaining = (announcement["apply_end_date"] - date.today()).days
        if 0 <= remaining <= 30:
            score += 15
        elif remaining < 0:
            score -= 20
    return max(score, 0), ok, reasons


def recommendations(user_id: int) -> list[dict]:
    user = repo.get_user(user_id) or {}
    profile = repo.get_profile(user_id) or {}
    announcements = repo.announcement_map()
    ranked = []
    for policy in repo.list_policies():
        score, ok, _ = _score_policy(policy, user, profile, announcements)
        ranked.append(_to_item(policy, match_score=score, eligible=ok, announcements=announcements))
    ranked.sort(key=lambda item: (item.get("eligible") or False, item.get("matchScore") or 0), reverse=True)
    preferred = [item for item in ranked if item.get("eligible") or (item.get("matchScore") or 0) >= 40]
    return preferred or ranked[:3]


def _apply_period(announcement: dict) -> str:
    """없는 쪽 날짜는 표기하지 않는다. 원천 공고에 시작일이 없는 경우가 많다."""
    start = announcement.get("apply_start_date")
    end = announcement.get("apply_end_date")
    if start and end:
        return f"{start} ~ {end}"
    if end:
        return f"~ {end}"
    if start:
        return f"{start} ~"
    return ""


def detail(policy_id: int) -> dict:
    policy = repo.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="정책을 찾을 수 없습니다.")
    announcement = _announcement_of(policy_id)
    period = ""
    method = None
    if announcement:
        period = _apply_period(announcement)
        # 컬럼은 있고 값이 NULL이면 dict.get의 기본값이 아니라 None이 온다. 그대로 내보낸다.
        method = announcement.get("apply_method")
    return {
        "policy": _to_item(policy),
        "applyPeriod": period,
        "applyMethod": method,
        "announcementId": announcement["id"] if announcement else None,
    }


def eligibility(policy_id: int, user_id: int) -> dict:
    policy = repo.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="정책을 찾을 수 없습니다.")
    user = repo.get_user(user_id) or {}
    profile = repo.get_profile(user_id) or {}
    ok, reasons = _match_rule(policy.get("eligibility_rule") or "", user, profile)
    return {"eligible": ok, "reasons": reasons}


def save_policy(user_id: int, policy_id: int) -> None:
    if not repo.get_policy(policy_id):
        raise HTTPException(status_code=404, detail="정책을 찾을 수 없습니다.")
    repo.save_policy(user_id, policy_id)


def saved_list(user_id: int) -> list[dict]:
    items = []
    for pid in repo.saved_policy_ids(user_id):
        policy = repo.get_policy(pid)
        if policy:
            items.append(_to_item_for_user(policy, user_id))
    items.sort(key=lambda item: (item.get("eligible") or False, item.get("matchScore") or 0), reverse=True)
    return items


def announcement_summary(announcement_id: int) -> dict:
    announcement = repo.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    cached = repo.get_summary(announcement_id)
    if cached:
        return {
            "target": cached["target"],
            "benefit": cached["benefit"],
            "period": cached["period"],
            "documents": cached["documents"],
            "notes": cached["notes"],
            "source": cached["source"],
            "llmUsed": bool(cached.get("llm_used")),
        }
    raw_content = str(announcement.get("raw_content") or "").strip()
    if not raw_content:
        raise HTTPException(
            status_code=422,
            detail="공고문 원문이 없어 AI 요약을 생성할 수 없습니다.",
        )
    llm = summarize_announcement(raw_content, announcement.get("source_url"))
    if llm and llm.get("benefit"):
        summary = {
            "target": llm.get("target") or "",
            "benefit": llm.get("benefit") or "",
            "period": llm.get("period") or "",
            "documents": llm.get("documents") or "",
            "notes": llm.get("notes") or "",
            "source": llm.get("source") or announcement.get("source_url") or "",
            "llm_used": bool(llm.get("llmUsed")),
        }
        repo.upsert_summary(announcement_id, summary)
        cached = {**summary, "llm_used": summary["llm_used"]}
    if not cached:
        raise HTTPException(status_code=404, detail="공고 요약을 찾을 수 없습니다.")
    return {
        "target": cached["target"],
        "benefit": cached["benefit"],
        "period": cached["period"],
        "documents": cached["documents"],
        "notes": cached["notes"],
        "source": cached["source"],
        "llmUsed": bool(cached.get("llm_used")),
    }
