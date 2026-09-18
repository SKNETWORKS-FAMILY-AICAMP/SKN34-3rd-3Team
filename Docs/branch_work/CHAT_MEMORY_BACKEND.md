# Backend 담당 작업 — 사용자별 대화 문맥 전달

이 문서 전체를 작업 에이전트(Codex/Claude Code)에 입력해 구현한다.

## 목표

인증된 사용자의 기존 `chat_messages` 기록을 `user_id + category` 기준으로 조회해 다음
LLM 요청에 대화 문맥으로 전달한다. DB 저장은 이미 구현돼 있으므로 새 대화 테이블이나
`conversation_id`를 만들지 않는다.

## 작업 경계

- 수정 허용: `Backend/` 내부만
- 수정 금지: `LLM/`, `Frontend/`, `DB/`, `Docs/`, `docker-compose.yml`, 루트 설정 파일
- 기존 `status`, `guardrailReason`, `llmUsed`, `needsConfirmation` 처리와 목업 fallback을 보존한다.
- 사용자가 만든 다른 변경을 되돌리거나 파일 전체를 과거 버전으로 덮어쓰지 않는다.

## 고정 계약

Frontend→Backend 요청은 변경하지 않는다.

```json
{"category":"tax","question":"가족이 두 명이면?"}
```

Backend→LLM `POST /rag/chat`에는 다음 선택 필드를 추가한다.

```json
{
  "conversationHistory": [
    {"role":"user","content":"월급은 320만원이야"},
    {"role":"assistant","content":"..."}
  ]
}
```

- 완료된 과거 대화 최대 10쌍 = 메시지 최대 20개
- 순서는 오래된 메시지부터 최신 메시지까지
- role은 `user`, `assistant`만 허용하며 항상 한 쌍으로 구성
- 질문은 1,000자, 답변은 4,000자까지만 사용
- 전체가 12,000자를 넘으면 가장 오래된 질문/답변 쌍부터 제거
- 현재 질문은 `question` 필드로만 보내고 history에 중복 포함하지 않음
- history가 없으면 `conversationHistory`를 생략

## 구현

1. `core/repo.py`
   - `user_id`, `category`, limit으로 최근 완료 대화를 조회하는 전용 함수를 추가한다.
   - SQL은 `created_at DESC, id DESC LIMIT ?`로 최근 행을 고른 뒤 반환은 시간순으로 뒤집는다.
   - 다른 사용자의 행이나 다른 category의 행이 섞이지 않게 한다.
   - 기존 전체 기록 조회/삭제 함수의 의미는 바꾸지 않는다.

2. `services/chat_service.py`
   - LLM 호출 전에 최근 10개 DB 행을 조회한다.
   - 각 행을 user 질문과 assistant 답변으로 변환하고 위 길이 규칙을 적용한다.
   - 현재 답변은 LLM 호출이 끝난 뒤 기존 `insert_chat`으로 저장한다.
   - 인증 dependency가 전달한 `user_id`만 사용한다. 요청 body에서 user ID를 받지 않는다.
   - 과거 assistant 답변은 문맥으로만 전달하며 근거 데이터라고 표시하지 않는다.

3. `core/llm_client.py`
   - `rag_answer(..., conversation_history=None)` 인자를 추가한다.
   - 비어 있지 않을 때만 JSON의 `conversationHistory`로 직렬화한다.
   - 기존 category별 timeout, `userContext`, `noticeResults`, 오류 처리를 유지한다.

4. 테스트
   - `Backend/tests/`에 표준 `unittest` 기반 테스트를 추가한다. 새 테스트 의존성은 추가하지 않는다.
   - repo/LLM 호출은 mock 처리하고 실제 DB·LLM·네트워크를 사용하지 않는다.

## 필수 테스트

- 사용자 A 기록만 A 요청에 전달되고 사용자 B 기록은 제외된다.
- 같은 사용자의 `tax`와 `policy` 기록이 섞이지 않는다.
- 최근 10쌍만 시간순으로 전달된다.
- 1,000/4,000자 및 총 12,000자 제한 시 가장 오래된 쌍부터 제거된다.
- 첫 질문은 `conversationHistory` 없이 기존 payload로 호출된다.
- 현재 질문이 history에 중복되지 않고 LLM 응답 후 DB에 저장된다.
- 기존 `status/guardrailReason/ragUsable` 관련 응답 계약이 유지된다.

## 완료 조건

```powershell
cd Backend
$env:UV_CACHE_DIR='.uv-cache-agent'
uv run python -m unittest discover -s tests -v
```

- 위 테스트 통과
- Backend 이외 tracked 파일 변경 없음
- 실제 DB 쓰기, 실제 LLM 호출, Docker 변경 없음
- 완료 보고에 변경 파일, 테스트 결과, LLM 담당자가 알아야 할 계약만 요약
