# develop 시연 결함 목록

- 작성일: 2026-09-14
- 갱신일: 2026-09-14 (`develop` / `8c0484d` 기준으로 상태 재대조)
- 최초 조사 기준: `develop` / `0f2d1de`

## 0. 요약

`develop` 시연 중 사용자가 보고한 사용성 결함과 그 조사 중 발견한 결함을 모음. `Docs/reports/INTEGRATION_ISSUES_0910.md`(1~42)와 성격이 달라 파일을 나누고 **번호는 43부터 이어 씀.**

| 번호 | 결함 | 심각도 | 상태 |
| --- | --- | --- | --- |
| 43 | 채팅 말풍선이 마크다운을 평문으로 출력함 | P1 | 미해결 |
| 44 | 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함 | P1 | 미해결 |
| 45 | AI 답변이 느림 | P1 | 일부 해결 |
| 46 | 상담 기록이 전 카테고리를 평면 나열함 | P2 | 미해결 |
| 47 | 저장한 공고 마감일이 캘린더에 뜨지 않음 | P1 | 해결 `8c0484d` |
| 48 | 저장한 공고 목록이 페이지 이동 시 초기화됨 | P0 | 해결 `4b88fec` |
| 49 | 캘린더 일정이 늘면 로드맵 진행률도 증가 | 미확정 | 재현 안 됨 |
| 50 | 채팅방 경계가 계정별로 나뉘지 않음 | P2 | 미해결 |
| 51 | 로드맵 진행률이 로그아웃 후 다음 계정에 남음 | P2 | 미해결 |

**미해결 작업 영역**

| 번호 | 프론트엔드 | 백엔드 | DB | LLM |
| --- | :-: | :-: | :-: | :-: |
| 43 | ● | | | ○ |
| 44 | | | | ● |
| 45 | | ● | | ● |
| 46 | ● | ○ | ○ | |
| 50 | ● | | | |
| 51 | ● | | | |

**해결된 결함 요약.** 48은 저장 목록을 `App` 상태로 올리고 `POST`/`DELETE /policies/{id}/save`·`GET /policies/saved`로 서버와 동기화함. 47은 48로 첫째 원인이 풀렸고, 마이페이지 캘린더가 내 일정·세금 신고일·저장한 정책 마감일을 함께 보여주도록 필터를 고침. 테스트 `Backend/tests/test_saved_policies.py`. 어디서도 렌더되지 않는 `GovExplorer`는 죽은 코드라 손대지 않음.

---

## 1. P1 — 화면·응답 품질

### 43. 채팅 말풍선이 마크다운을 평문으로 출력함

- 위치: `Frontend/src/App.jsx:1033`(완료 말풍선), `:1054`(스트리밍 말풍선), `:1608`(상담 기록), `Frontend/src/styles.css` `.msg`
- 증상: AI 답변의 `**굵게**`·`###`·`- ` 기호가 그대로 보이고, 줄바꿈이 사라져 한 문단으로 뭉쳐 나옴
- 원인: 말풍선이 답변 문자열을 텍스트 노드로 그대로 출력함. 의존성은 `react`·`react-dom`뿐이고 마크다운 파서가 없음
- 줄바꿈은 별개 원인임. `.msg`에 `white-space` 규칙이 없어 `\n`이 공백으로 합쳐짐. `pre-wrap`을 쓰는 `.clog__a`만 줄바꿈이 살아 있음
- 답변이 마크다운을 담는 이유: `generate_unified_answer`(`LLM/src/rag/answer.py`) 프롬프트가 출력 형식을 제한하지 않음
- 영향 범위: `AiConsult`를 쓰는 로드맵 코치·세무 Assistant·공고지원 AI 세 화면
- 조치 방향: 의존성 없이 경량 렌더러로 React 엘리먼트를 만듦. `dangerouslySetInnerHTML`을 쓰지 않음. 제목·불릿·번호 목록·인용·코드 펜스·`**굵게**`·인라인 코드·링크(`http`/`https`만)로 한정함

### 44. 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함

- 위치: `LLM/src/rag/graph.py:192-219`(`REQUIRED_USER_INPUTS`), `:869`(`tax_calculation_plan_node`), `LLM/src/rag/answer.py:145`
- 증상: 세액감면을 물으면 답변 대신 확인할 정보 목록만 길게 나옴
- 원인: 결정적 테이블임. `startup_tax_reduction`이 `eligible_tax_krw`·`startup_year`·`age`·`business_location`·`industry`·`first_startup` 6개를 요구하고, 없는 항목이 하나라도 있으면 `missing_calculation_input`으로 **LLM을 건너뛰고** 고정 문자열을 냄
- `DEFAULT_CALCULATION_INPUTS`(`graph.py:221`)는 `withholding_tax`·`general_vat`에만 기본값이 있음
- **6개 중 4개는 물을 필요가 없음.** `state["user_context"]`(`UserProfile`)가 `age`·`region`·`business.industry`·`business.founded_at`을 이미 들고 있음
- 헛짚기 쉬운 곳: `POLICY_DISCOVERY_PROMPT`와 `RAG_PROMPT`(`LLM/src/rag/prompts.py`)는 챗 경로 밖임. 고쳐도 증상이 바뀌지 않음
- 조치 방향: 프로필에서 값을 선채움하고 출처를 `calculation_assumptions`에 남김. `first_startup`은 기본값과 가정 문구를 추가함. 남은 요구는 한 번에 최대 2개로 자름

### 45. AI 답변이 느림 — 일부 해결

- 요청 경로: `AiConsult.ask` → `api.chat` → `Backend/api/chat.py` → `Backend/core/llm_client.py` → `LLM/src/serving/rag_routes.py` → `graph.ainvoke`
- 해결된 것: 분류성 호출에 `reasoning_effort="low"` 적용(`LLM/src/rag/graph.py:498`, `0a262be`·`5bda8bf`). 프론트 챗 타임아웃을 서버 예산에 맞추고 진행 상황 문구를 표시함(`e619d23`)

**남은 원인**

1. **결과가 버려지는 호출이 있음.** `_route_for_category`(`graph.py:447`)가 `tax`·`expense`를 무조건 `tax`로 확정하는데 그 앞의 라우터 LLM 호출은 그대로 돎. 강도는 낮아졌으나 호출 자체가 낭비임
2. **요청마다 객체를 새로 만듦.** `rag_routes.py:861`의 `build_graph(...)`와 `rag_runtime.llm_factory()`(새 `ChatOpenAI`·httpx 클라이언트), `LLM/src/rag/reranker.py:44`의 `cohere.ClientV2`, `LLM/src/vectorstores/postgres.py`의 커넥션(풀 없음)
3. **스트리밍이 없음.** LLM은 `chain.ainvoke` + `with_structured_output`, Backend는 응답 본문을 통째로 읽고(`llm_client.py:264`), 프론트는 `res.json()`임. 세 계층의 응답 방식을 모두 바꾸고 구조화 출력 검증과 충돌하므로 범위 밖으로 둠
4. `.env`의 `LANGSMITH_TRACING=true`가 프로세스 환경에 닿으면 모든 체인 단계가 추적을 전송함

- 조치 방향: 버려지는 라우터 호출을 건너뜀, 요청마다 만들던 그래프·클라이언트를 재사용함

---

## 2. P2 — 설계 한계

### 46. 상담 기록이 전 카테고리를 평면 나열함

사용자 질문은 "의도한 부분인지"였음. **의도된 설계가 아니라 한계임.**

- 위치: `Frontend/src/App.jsx` `ChatLog`(1561~), `DB/01_schema.sql` `chat_messages`
- 증상: 마이페이지 상담 기록이 대화방 구분 없이 세무·공고·로드맵 대화를 섞어 나열함
- 원인: **서버에 대화방 개념이 없음.** `chat_messages`는 한 행에 질문·답변이 들어가고 구분 축은 `category`뿐임. 사실상 사용자·카테고리당 스레드 하나임
- 채팅 화면의 "방"은 프론트가 브라우저에만 만든 것임. "새 대화" 시점의 마지막 메시지 id를 `changeup:chat-rooms:<category>` 키(`App.jsx:673`)에 저장해 경계로 씀
- `ChatLog`는 그 경계를 쓰지 않고 `api.chatHistory()`를 카테고리 인자 없이 호출함
- `GET /chat/messages`에 `response_model`이 없어 snake_case 원본이 나감(0910 결함 25)
- LLM 대화 문맥도 같은 한계임. `repo.recent_chats(user_id, category, limit)`로 복원하므로 이전 방의 대화가 다음 방 문맥에 섞임
- 조치 방향 둘 중 선택이 필요함
  - **프론트만 고침**: `ChatLog`가 카테고리별로 조회하고 `loadRooms`와 방 분할 로직을 재사용함. 다른 기기에서는 한 방으로 합쳐 보임
  - **서버 기준 대화방**: `chat_messages`에 세션 컬럼을 넣음. `repo.recent_chats`·`list_chats`와 `Backend/tests/test_chat_history.py`·`test_repo_recent_chats.py`가 함께 바뀜

### 50. 채팅방 경계가 계정별로 나뉘지 않음

- 위치: `Frontend/src/App.jsx:673-688`(`ROOMS_KEY`·`loadRooms`·`saveRooms`), `:781-784`
- 증상: 같은 브라우저에서 계정을 바꾸면 이전 계정의 대화방 구분이 사라짐
- 원인: localStorage 키가 `changeup:chat-rooms:<category>`로 사용자 id를 포함하지 않음. 기록을 불러올 때 `b <= maxId`인 경계만 남기고 다시 저장하므로, 기록이 적은 계정이 로그인하면 다른 계정의 경계를 지움
- 조치 방향: 키에 사용자 id를 넣음. 결함 46에서 서버 기준 대화방을 택하면 함께 사라짐

### 51. 로드맵 진행률이 로그아웃 후 다음 계정에 남음

- 위치: `Frontend/src/App.jsx:3311`(`roadmapDone`), `:3402-3411`·`:3431-3435`(로그아웃)
- 증상: 로드맵 체크 후 로그아웃하고 다른 계정으로 로그인하면 진행률이 그대로 보임
- 원인: `roadmapDone`이 `App` 최상위 `useState({})`이고 로그아웃 경로가 초기화하지 않음. `savedPolicies`는 `userId` 변화에 맞춰 비우지만(`:3352-3363`) 이 상태에는 같은 처리가 없음
- 비고: 서버에 저장되지 않아 새로고침해도 사라짐. 결함 49의 취약점 2와 같은 뿌리임
- 조치 방향: `userId` 변화 시 `setRoadmapDone({})`

---

## 3. 재현되지 않은 건

### 49. 캘린더 일정이 늘면 로드맵 진행률도 증가

- 보고 내용: 마이페이지 캘린더에 일정을 추가하면 창업 로드맵 진행률도 함께 오름
- **현재 소스에서 재현 경로를 찾지 못함.** 진행률의 근거는 `roadmapDone` 하나이고, 쓰는 곳은 `RoadmapGuide` 체크박스 `toggle` 하나뿐임. `MpCalendar`는 이 상태를 건드리지 않음
- 같은 증상을 만들 수 있는 취약점 둘
  1. 진행률 계산이 `Object.values(roadmapDone).filter(Boolean).length`라 키를 검증하지 않음. `ROADMAP_TASKS`에 없는 키가 들어가면 부풀 수 있음
  2. 어디에도 저장되지 않아 새로고침·계정 전환마다 값이 달라짐(결함 51)
- 재현 요청: 개발 서버인지 배포본인지, 체크박스를 누르지 않은 상태에서도 0%가 아니었는지, 늘어난 것이 퍼센트·`N / 7단계`·"이번 달 일정 N건" 중 무엇인지

---

## 4. 확인 결과 문제가 아닌 것

- **계정을 바꿔도 공고·채팅 기록이 같게 보인 것은 결함이 아님(2026-09-14).** DB 사용자는 `demo@demo.com`(id 1)과 비밀번호를 모르는 계정(id 2)뿐이었음. 로그인 폼 기본값(`App.jsx:442-443`)과 카카오·네이버 버튼(`App.jsx:522`)이 모두 demo 계정으로 로그인하므로 사실상 같은 계정이었음. Backend는 채팅·저장 정책·캘린더를 전부 토큰의 user_id로 거름. 확인용 계정 `demo1@demo.com`/`demo1`(id 3)을 가입 API로 추가했고 채팅·저장 목록이 비어 있음을 확인함. 이 계정은 DB 볼륨에만 있고 시드에는 없음. 조사 중 결함 50·51을 발견함
- **`GovExplorer`는 죽은 코드임.** 어디서도 렌더되지 않음. 이 컴포넌트만 보면 공고 목록이 서버에서 온다고 오해하기 쉬움
- **목데이터 폴백이 조용함.** `useApi`(`Frontend/src/api.js`)가 401이나 타임아웃에 말없이 폴백으로 내려감. 백엔드가 없거나 로그인이 풀렸을 때 가짜 데이터가 진짜처럼 보이므로, 이런 모양의 결함 신고는 먼저 이 경로를 의심할 것
- **`POLICY_DISCOVERY_PROMPT`와 `RAG_PROMPT`는 챗 경로 밖임.** 결함 44에 적음
- **`.env`는 git에 추적되지 않음.** 다만 API 키가 평문으로 들어 있으므로 파일을 팀 밖으로 공유할 때 주의가 필요함
- **`DB/scripts/09_normalize_region.sql`은 적용할 필요가 없음.** 수집기가 적재 시 정규화하고 로컬 DB에 비정규 region이 0건임
- **`DB/scripts/10_backfill_bizinfo_region.py`는 실행되지 않은 상태임.** bizinfo 정책 중 `region IS NULL` 1541건. 외부 API 호출이 필요해 별도 작업으로 둠

## 5. 범위 밖으로 남기는 것

- `Backend/api/chat.py`의 `send_message`가 `async def`가 아니고 `Backend/core/llm_client.py`가 블로킹 `urllib`을 씀. 챗 요청 하나가 스레드풀 워커를 최대 120초 점유하고 기본 풀이 40이라 동시 세무 질문이 몰리면 서버 전체가 멈춤. 비동기 HTTP 클라이언트 전환이 필요함
- 토큰 스트리밍(결함 45), 서버 기준 대화방(결함 46)

## 6. 관련 문서

- 통합 결함 목록(1~42): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 진행 현황: `Docs/STATUS.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md`
- API 규격: `Docs/Design/API_SPEC.md`
- 데이터 구조: `Docs/Design/ERD.md`
