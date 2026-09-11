# LLM Tax Advance 리뷰 후속 수정·병합 인수인계

- 작성일: 2026-09-11
- 브랜치: `feature/LLM-tax_advence`
- 기준 HEAD: `d376705`
- 참고 리뷰: `LLM_TAX_ADVENCE_PR_REVIEW_0911.md`

## 1. 결론

리뷰의 비평가 항목 2~11은 현재 코드 기준으로 모두 처리했다. 관련 자동 테스트와
Frontend production build에서 새 회귀는 확인되지 않았다.

다만 다음 사항은 완료 주장 범위에서 제외한다.

- 리뷰 1·12의 평가 데이터셋/기준선 문제는 요청에 따라 별도 과제로 남겼다.
- 실제 OpenAI·Cohere 호출, 실제 DB 쓰기, Docker 전체 E2E는 수행하지 않았다.
- 따라서 "리뷰에서 확인된 비평가 결함 해결"까지가 현재 검증 범위이며, 운영상 문제가
  절대 없다는 의미는 아니다.

## 2. 계층별 변경사항

### Backend

- DB에는 화면 복원을 위해 모든 채팅을 계속 저장한다.
- LLM 문맥 조립 시 Mock 연결 안내, 로드맵 범위 밖 안내, integration/error 문구는 제외한다.
- 정상 질문/답변만 `conversationHistory`로 재사용한다.
- 회귀 테스트로 차단·연결 실패 답변이 다음 로드맵 문맥에 들어가지 않는 것을 고정했다.

주요 파일:

- `Backend/services/chat_service.py`
- `Backend/tests/test_chat_history.py`

주의: DB에 `status`/`guardrail_reason` 컬럼이 없으므로 현재 제외 판정은 알려진 답변
문구를 기준으로 한다. 해당 문구를 변경할 때 `NON_CONTEXT_ANSWERS`도 함께 갱신해야 한다.

### Docs

동결 계약 문서 `Docs/Design/LLM_API_SPEC_V1.md`를 실제 구현과 맞췄다.

- `category`: `tax | expense | saving | policy | roadmap`
- `roadmapStep`: `A | B | C | D | E | F | Z`
- `conversationHistory`: 최대 10쌍·20개 메시지, 총 12,000자
- 실제 모델 Prompt 이력: 모든 route에서 최근 5쌍·4,000자
- 응답 `route`에 `roadmap` 추가
- Roadmap chat timeout: `LLM_TIMEOUT_CHAT_POLICY` 30초

LLM 내부 문서인 `LLM/README.md`, `LLM/LANGGRAPH_ARCHITECTURE.md`에도 공통 Prompt
이력 제한을 반영했다.

### Frontend

- 공고지원 AI가 기본 `tax` 대신 `category="policy"`를 전송한다.
- 비로그인 로드맵 질문에서 `SubPage → RoadmapGuide → AiConsult`로 로그인 callback을
  전달해 로그인 버튼이 표시된다.
- 화면에만 존재하던 `RG_CHAT_SEED`와 로드맵용 Claude prompt를 제거해 사용자에게 보이는
  문맥과 실제 LLM 문맥의 불일치를 없앴다.
- 로드맵 추천 칩의 Frontend 하드코딩을 제거하고
  `GET /chat/categories/roadmap/suggested-questions` 결과를 사용한다.
- Backend 추천 질문 조회가 실패하면 임의 문구로 대체하지 않고 추천 칩을 비운다.

주요 파일: `Frontend/src/App.jsx`

### LLM

- Roadmap 답변은 Prompt에서 500자 이하를 요구하고 서버에서도 최대 500자로 제한한다.
- Roadmap 전용 호출에 `max_completion_tokens=900`을 적용해 구조화 JSON 여유를 남기면서
  불필요한 출력 토큰 생성을 제한한다.
- `in_scope=true`와 잘못된 redirect가 함께 오면 redirect를 `none`으로 정규화해 전체
  응답이 error로 끝나는 문제를 막았다.
- Roadmap 모델 호출 전에 차단 키워드 기반 결정적 Guardrail을 추가했다. 단,
  `게임 개발 창업`처럼 차단 단어와 로드맵 문맥이 함께 있으면 의미 기반 모델 판정으로
  넘겨 정상 질문 오탐을 줄인다.
- 공통 `compact_conversation_history()`를 추가해 Contextualize, Unified Answer,
  Roadmap Prompt가 모두 최근 5쌍·4,000자만 사용한다.
- 질문 정규화의 전체 `html.unescape()`를 제거했다. `&#x20;`, `&#32;`, `&nbsp;` 등 실제
  whitespace 엔티티만 공백으로 바꾸고 `&lt;`, `&amp;`, `&#39;` 등은 원문을 보존한다.

주요 파일:

- `LLM/src/rag/roadmap.py`
- `LLM/src/rag/graph.py`
- `LLM/src/rag/history.py`
- `LLM/src/rag/answer.py`
- `LLM/src/rag/guardrails.py`

## 3. 리뷰 항목 처리표

| 리뷰 번호 | 상태 | 처리 내용 |
| ---: | --- | --- |
| 1 | 제외 | 평가 데이터셋 과제 |
| 2 | 해결 | 500자 사후 제한, 900 completion token 상한, redirect 정규화 |
| 3 | 해결 | V1 category/route/history/step/timeout 계약 갱신 |
| 4 | 해결 | Roadmap 모델 호출 전 문맥 인식형 결정적 차단 |
| 5 | 해결 | 실패·차단 답변을 DB 이력 표시와 LLM 문맥에서 분리 |
| 6 | 해결 | 모든 모델 Prompt의 대화 이력을 5쌍·4,000자로 압축 |
| 7 | 해결 | 공고지원 AI를 `policy` category로 연결 |
| 8 | 해결 | 로드맵 로그인 callback 연결 |
| 9 | 해결 | 화면 전용 Roadmap seed 제거 |
| 10 | 해결 | Backend 추천 질문 API를 단일 원본으로 사용 |
| 11 | 해결 | HTML whitespace 엔티티만 제한적으로 정규화 |
| 12 | 제외 | 평가 기준선 과제 |

## 4. 검증 결과

```text
LLM 전체 pytest:       273 passed
Backend 전체 unittest: 28 passed
Frontend build:         success
git diff --check:        이상 없음
```

검증 중 실제 외부 모델, 재색인, DB 쓰기는 사용하지 않았다.

## 5. 병합·통합 시 확인사항

권장 반영 순서는 `LLM → Backend → Frontend → Docs`다. DB schema migration은 없다.

병합 후 Docker 이미지는 자동 reload되지 않으므로 다음과 같이 재빌드한다.

```powershell
docker compose --profile frontend up -d --build backend llm frontend
```

최소 수동 확인 시나리오:

1. 로드맵에서 정상 질문 시 `route=roadmap`, 500자 이하 답변을 받는다.
2. 로드맵에서 날씨 질문 시 모델 호출 없이 범위 밖 안내를 받는다.
3. 공고지원 AI 질문이 `policy/notice` 경로로 처리된다.
4. 비로그인 로드맵 질문에서 로그인 버튼이 표시된다.
5. 연결 실패·범위 밖 답변 다음의 정상 질문에 실패 문구가 대화 Context로 전달되지 않는다.
6. `&#x20;`이 붙은 경비 질문은 정상 통과하고 `&lt;...&gt;`는 임의 디코딩되지 않는다.

평가 리포트의 이전 기준선 비교와 Mock/PostgreSQL 평가 사용자 정합성은 이 문서의 완료
범위에 포함하지 않는다.
