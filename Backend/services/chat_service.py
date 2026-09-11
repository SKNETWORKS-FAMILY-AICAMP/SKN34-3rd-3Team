import logging
from datetime import date

from fastapi import HTTPException

from core import repo
from core.llm_client import rag_answer

logger = logging.getLogger(__name__)

# 공고 본문 전문을 20건 보내면 LLM 컨텍스트가 넘치므로 앞부분만 넘긴다.
NOTICE_TEXT_LIMIT = 800

SUGGESTED = {
    "tax": [
        "부가가치세는 언제 신고하나요?",
        "간이과세자와 일반과세자 차이는 무엇인가요?",
        "청년창업 세액감면 대상인지 알고 싶어요.",
    ],
    "expense": [
        "커피 영수증도 경비처리가 되나요?",
        "노트북 구매는 어떻게 비용 처리하나요?",
        "접대비와 복리후생비는 어떻게 구분하나요?",
    ],
    "saving": [
        "1인 창업자가 당장 챙길 절세 포인트는?",
        "홈택스에서 확인할 공제 항목이 있나요?",
        "사업용 계좌를 꼭 써야 하나요?",
    ],
    "policy": [
        "지금 신청 가능한 청년 창업 지원금이 있나요?",
        "예비창업패키지 자격 조건을 알려주세요.",
        "서울 거주 창업자가 받을 수 있는 정책은?",
    ],
}

MOCK_ANSWERS = {
    "tax": "세금 일정과 신고 유형은 사업자 등록 유형에 따라 달라집니다. LLM 서비스에 연결되지 않아 샘플 안내입니다. 실제 신고 전에는 국세청 자료 또는 세무 전문가 확인이 필요합니다.",
    "expense": "사업과 직접 관련된 지출은 증빙이 있으면 경비로 볼 여지가 있습니다. 최종 인정 여부는 세무서·세무사 확인이 필요합니다.",
    "saving": "장부 구분, 사업용 계좌, 감면 요건 확인이 기본입니다. 본 답변은 세무 자문을 대체하지 않습니다.",
    "policy": "사용자 나이·지역·업력을 기준으로 안내합니다. 실제 자격은 공고문 원문을 확인해야 합니다.",
}


def suggested_questions(category: str) -> list[str]:
    return SUGGESTED.get(category, SUGGESTED["tax"])


def _profile_prefix(user_id: int) -> str:
    user = repo.get_user(user_id) or {}
    profile = repo.get_profile(user_id) or {}
    context = f"{user.get('name') or '회원'}님"
    extras = [x for x in (user.get("region"), profile.get("industry")) if x]
    if extras:
        context += f"({', '.join(extras)})"
    return context


def _date_str(value) -> str | None:
    """LLM 계약의 날짜 필드는 YYYY-MM-DD 문자열이다."""
    if not value:
        return None
    if isinstance(value, date):
        return value.isoformat()
    return str(value)[:10]


def _clip(value) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    return text[:NOTICE_TEXT_LIMIT]


def _user_context(user_id: int) -> dict | None:
    """`RagChatRequest.userContext`. BackendUserContext는 extra="forbid"라 필드를 하나씩 만든다."""
    user = repo.get_user(user_id)
    if not user:
        return None
    profile = repo.get_profile(user_id) or {}
    age = user.get("age")
    return {
        "userId": user["id"],
        # 계약이 0~150만 허용한다. 벗어난 값을 보내면 요청 전체가 422가 된다.
        "age": age if isinstance(age, int) and 0 <= age <= 150 else None,
        "region": user.get("region"),
        "businessType": profile.get("business_type"),
        "industry": profile.get("industry"),
        "businessRegisteredAt": _date_str(profile.get("business_registered_at")),
        "foundedAt": _date_str(profile.get("founded_at")),
    }


def _notice_results() -> list[dict]:
    """`RagChatRequest.noticeResults`. BackendNoticeResult도 extra="forbid"다."""
    notices = []
    for row in repo.open_announcements():
        title = str(row.get("title") or "").strip()
        if not title:
            continue
        notices.append(
            {
                "announcementId": row["id"],
                "policyId": row.get("policy_id"),
                "title": title,
                "content": _clip(row.get("raw_content")),
                "benefit": _clip(row.get("benefit")),
                "sourceUrl": row.get("source_url"),
                "applyStartDate": _date_str(row.get("apply_start_date")),
                "applyEndDate": _date_str(row.get("apply_end_date")),
            }
        )
    return notices


def _sources_from_rag(rag: dict) -> list[dict]:
    sources = []
    for item in rag.get("sources") or []:
        sources.append(
            {
                "title": item.get("title") or item.get("source") or "RAG 문서",
                # url은 사용자에게 보여줄 링크, source는 원천 식별자로 별도 필드다.
                "url": item.get("url") or "",
                "excerpt": item.get("excerpt") or "",
            }
        )
    return sources


def send_message(user_id: int, category: str, question: str) -> dict:
    if category not in SUGGESTED:
        raise HTTPException(status_code=400, detail="지원하지 않는 카테고리입니다.")
    rag = rag_answer(
        question,
        category=category,
        # 프로필은 질문 문자열이 아니라 계약 필드로 보낸다.
        user_context=_user_context(user_id),
        # 라우터가 policy와 notice 중 무엇을 고를지 미리 알 수 없으므로 policy에는 항상 보낸다.
        # 보내지 않으면 notice route가 integration_unavailable로 끝난다.
        notice_results=_notice_results() if category == "policy" else None,
    )
    status = rag.get("status") if rag else None
    guardrail = rag.get("guardrail_reason") if rag else None
    # LLM이 200으로 답했으면 status가 무엇이든 그 문장을 그대로 보존한다.
    # 답변 생성은 LLM 책임이므로(V1 10절) 목업은 LLM에 닿지 못했을 때만 쓴다.
    usable = bool(rag and rag.get("answer"))

    if not usable:
        # 이 경로는 llm_client의 경고가 안 찍힐 수도 있어 여기서 따로 남긴다.
        logger.warning(
            "Chat fallback to mock: category=%s reason=%s",
            category,
            "llm_unreachable" if rag is None else "empty_answer",
        )
        status = "integration_unavailable"
        guardrail = None
        full_answer = (
            f"{_profile_prefix(user_id)} 질문: “{question}”\n\n{MOCK_ANSWERS[category]}\n\n"
            "※ 근거 문서를 확인하지 못한 참고 안내입니다. 국세청·공고 원문 또는 전문가 확인이 필요합니다."
        )
        sources = []
        grounded = False
        llm_used = False
        needs_confirmation = True
    else:
        full_answer = rag["answer"]
        sources = _sources_from_rag(rag)
        grounded = bool(rag.get("grounded"))
        llm_used = True
        needs_confirmation = status != "success"
        if needs_confirmation:
            logger.warning(
                "Chat answer not grounded: category=%s status=%s guardrail=%s",
                category,
                status,
                guardrail,
            )
        if guardrail == "out_of_scope":
            # status는 no_result지만 근거 부족이 아니라 범위 밖 질문이다.
            sources = []
            grounded = False

    mid = repo.insert_chat(user_id, category, question, full_answer, sources)
    return {
        "messageId": mid,
        "answer": full_answer,
        "grounded": grounded,
        "llmUsed": llm_used,
        "needsConfirmation": needs_confirmation,
        # 프론트가 "LLM이 답했지만 실패"와 "근거 있게 답함"을 구분하려면 status가 필요하다.
        "status": status,
        "guardrailReason": guardrail,
    }


def get_sources(message_id: int, user_id: int) -> list[dict]:
    message = repo.get_chat(message_id)
    # 남의 메시지는 존재 사실 자체를 숨기려고 403이 아니라 404로 답한다.
    # 관리자 예외는 두지 않는다. 관리자 토큰의 id는 사용자 메시지와 일치하지 않는다.
    if not message or message.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="메시지를 찾을 수 없습니다.")
    return repo.chat_sources(message_id)


def list_messages(user_id: int, category: str | None = None) -> list[dict]:
    return repo.list_chats(user_id, category)


def clear_messages(user_id: int, category: str | None = None) -> int:
    return repo.delete_chats(user_id, category)
