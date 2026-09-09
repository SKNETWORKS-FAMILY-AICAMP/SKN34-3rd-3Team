"""AI 상담 (FS-05~08).

Backend 는 생성을 직접 하지 않고 LLM 서비스에 위임한다.
LLM 서비스가 떠 있지 않으면 DB 에서 근거 문서만 검색해 돌려준다(환각 방지).
"""

import re

import httpx

from core.config import settings
from core.db import query
from services import tax_service

_STOP = {
    "뭔가요", "인가요", "무엇", "어떤", "어떻게", "있나요", "되나요", "하나요",
    "합니까", "입니까", "알려줘", "알려주세요", "대해", "대한", "관해", "그리고",
    "저는", "제가", "해야", "하면", "인데", "라서", "때문",
}
_JOSA = re.compile(r"(이|가|은|는|을|를|의|에|도|와|과|으로|로|에서|에게|까지|부터|이나|나)$")


def keywords(question: str, top: int = 5) -> list[str]:
    """질문에서 검색에 쓸 핵심어를 뽑는다(조사·불용어 제거)."""
    cleaned = re.sub(r"[^0-9A-Za-z가-힣 ]", " ", question or "")
    out: list[str] = []
    for tok in cleaned.split():
        if len(tok) < 2 or tok in _STOP:
            continue
        stripped = _JOSA.sub("", tok)
        tok = stripped if len(stripped) >= 2 else tok
        if tok not in out and tok not in _STOP:
            out.append(tok)
    out.sort(key=len, reverse=True)
    return out[:top]


def _retrieve(question: str, k: int = 4) -> list[dict]:
    """세법 조문 + 정책에서 근거 후보를 뽑는다 (RAG 의 Retrieval 단계)."""
    found: dict[int, dict] = {}

    # 1) 질문 전체 → 2) 핵심어 순으로 세법 조문 검색
    for term in [question] + keywords(question):
        for doc in tax_service.search_documents(term, limit=k)["documents"]:
            found.setdefault(doc["id"], doc)
        if len(found) >= k:
            break
    if found:
        return list(found.values())[:k]

    # 3) 세법에서 못 찾으면 지원정책으로 폴백
    for term in keywords(question) or [question]:
        like = f"%{term}%"
        rows = query(
            """
            SELECT id, title, left(COALESCE(benefit, ''), 400) AS excerpt, source
            FROM policies
            WHERE title ILIKE %s OR target ILIKE %s
            LIMIT %s
            """,
            (like, like, k),
        )
        for r in rows:
            found.setdefault(
                r["id"],
                {
                    "id": r["id"],
                    "lawName": "지원정책",
                    "title": r["title"],
                    "excerpt": (r["excerpt"] or "").strip(),
                    "url": r.get("source"),
                },
            )
        if found:
            break
    return list(found.values())[:k]


def ask(question: str, category: str = "tax") -> dict:
    sources = _retrieve(question)

    # 1) LLM 서비스에 생성 위임
    try:
        with httpx.Client(timeout=20.0) as client:
            res = client.post(
                f"{settings.LLM_BASE_URL}/answer",
                json={"question": question, "category": category, "sources": sources},
            )
            if res.status_code == 200:
                data = res.json()
                return {
                    "answer": data.get("answer", ""),
                    "sources": data.get("sources", sources),
                    "generated": True,
                    "engine": data.get("engine", "llm-service"),
                }
    except (httpx.HTTPError, OSError):
        pass

    # 2) LLM 서비스가 없으면 검색 결과만 (근거 제시, 생성 없음)
    if sources:
        head = sources[0]
        answer = (
            f"「{head['title']}」에서 관련 내용을 찾았습니다.\n\n"
            f"{head['excerpt'][:300]}…\n\n"
            f"※ 생성형 답변은 LLM 서비스가 실행 중일 때 제공됩니다. "
            f"현재는 검색된 근거 문서 {len(sources)}건을 그대로 보여드립니다."
        )
    else:
        answer = (
            "관련 근거 문서를 찾지 못했습니다. 질문을 조금 더 구체적으로 적어주세요. "
            "(근거가 없으면 답변을 생성하지 않아 환각을 방지합니다.)"
        )
    return {"answer": answer, "sources": sources, "generated": False, "engine": "retrieval-only"}
