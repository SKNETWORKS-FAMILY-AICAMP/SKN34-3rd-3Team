# develop 시연 결함 목록

- 작성일: 2026-09-14
- 갱신일: 2026-09-14 (`develop` / `59f12a1` 기준으로 상태 재대조)
- 최초 조사 기준: `develop` / `0f2d1de`

## 0. 요약

`develop` 시연 중 사용자가 보고한 사용성 결함과 그 조사 중 발견한 결함을 모음. `Docs/reports/INTEGRATION_ISSUES_0910.md`(1~42)와 성격이 달라 파일을 나누고 **번호는 43부터 이어 씀.**

| 번호 | 결함 | 심각도 | 상태 |
| --- | --- | --- | --- |
| 43 | 채팅 말풍선이 마크다운을 평문으로 출력함 | P1 | 해결 `5635664` |
| 44 | 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함 | P1 | 일부 해결 `c1eae08` |
| 45 | AI 답변이 느림 | P1 | 일부 해결 |
| 46 | 상담 기록이 전 카테고리를 평면 나열함 | P2 | 해결 `5635664` |
| 47 | 저장한 공고 마감일이 캘린더에 뜨지 않음 | P1 | 해결 `8c0484d` |
| 48 | 저장한 공고 목록이 페이지 이동 시 초기화됨 | P0 | 해결 `4b88fec` |
| 49 | 캘린더 일정이 늘면 로드맵 진행률도 증가 | 미확정 | 해결 `5635664` |
| 50 | 채팅방 경계가 계정별로 나뉘지 않음 | P2 | 해결 `0068383` |
| 51 | 로드맵 진행률이 로그아웃 후 다음 계정에 남음 | P2 | 해결 `0068383` |

**미해결 작업 영역**

| 번호 | 프론트엔드 | 백엔드 | DB | LLM |
| --- | :-: | :-: | :-: | :-: |
| 44 | | | | ● |
| 45 | | ● | | ● |

**해결된 결함 요약.** 48은 저장 목록을 `App` 상태로 올리고 `POST`/`DELETE /policies/{id}/save`·`GET /policies/saved`로 서버와 동기화함. 47은 48로 첫째 원인이 풀렸고, 마이페이지 캘린더가 내 일정·세금 신고일·저장한 정책 마감일을 함께 보여주도록 필터를 고침. 테스트 `Backend/tests/test_saved_policies.py`. 어디서도 렌더되지 않는 `GovExplorer`는 죽은 코드라 손대지 않음. 43은 의존성 없는 `Markdown` 렌더러(`Frontend/src/App.jsx:709-775`)를 `AiConsult` 완료·스트리밍 말풍선(`:1145`·`:1166`)에 적용함. 로드맵 코치·세무 Assistant·공고지원 AI·홈 대화창이 같은 경로를 씀. 코드 펜스·링크는 미지원이나 답변 프롬프트가 기계적 제목을 금지해 영향이 적음. 46은 `ChatLog`를 카테고리별 탭으로 나눈 뒤 마이페이지 메뉴에서 제거함. 49는 로드맵 진행률을 `localStorage`에 저장하고 대시보드 그리드 행 높이를 분리함(사용자 확인). 50·51은 대화방 경계 키(`App.jsx:661`)와 로드맵 진행률 키(`:3475`)에 사용자 id를 넣음. 계정이 바뀌면 그 계정 값으로 교체하고 로그아웃하면 진행률을 비움(`:3543-3553`).

---

## 1. P1 — 응답 품질

### 44. 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함 — 일부 해결

- 증상: 세액감면을 물으면 답변 대신 확인할 정보 목록만 길게 나옴

**해결된 것 (`c1eae08`)** — 대상·자격 질문(계산 불필요) 경로

- `_is_individual_tax_judgment`를 삭제해 "내가 감면 대상이야?"도 일반 설명 경로를 탐(`LLM/src/rag/graph.py:895`)
- `TAX_ANSWER_PROMPT`(`LLM/src/rag/answer.py`)가 조건부 예시를 먼저 쓰고 추가 정보는 최대 2개만 요청하게 함. `_answer_context`(`graph.py:2057`)가 `missing_user_context`를 2개로 자름
- 근거가 부족해도 인용 가능한 출처가 있으면 고정 문자열 대신 LLM 답변을 생성함(`partial_evidence_answer`, `graph.py:1355`)
- 테스트 `LLM/tests/test_tax_graph.py:664`

**남은 것** — 감면액 계산 요청(`calculation_type=startup_tax_reduction`) 경로

- `REQUIRED_USER_INPUTS`(`graph.py:196-223`)가 `eligible_tax_krw`·`startup_year`·`age`·`business_location`·`industry`·`first_startup` 6개를 그대로 요구함. `DEFAULT_CALCULATION_INPUTS`(`graph.py:225`)에 startup 항목이 없음
- 하나라도 없으면 `tax_calculation_plan_node`(`graph.py:905`)가 `missing_calculation_input`으로 끝나고, `answer_node`가 **LLM을 건너뛰고** `fallback_answer("need_more_info", missing_user_context=전체)`(`graph.py:1365`)를 냄. 2개 절삭은 LLM 컨텍스트에만 적용되어 이 경로에서는 6개까지 나열됨
- **6개 중 4개는 물을 필요가 없음.** `state["user_context"]`(`UserProfile`)가 `age`·`region`·`business.industry`·`business.founded_at`을 이미 들고 있음. `CALCULATION_INPUT_PROMPT`(`LLM/src/rag/tax.py:187`)가 사용자 Context를 받지만 "명시된 age…" 문구라 추출 여부가 LLM 판단에 달림
- 헛짚기 쉬운 곳: `POLICY_DISCOVERY_PROMPT`와 `RAG_PROMPT`(`LLM/src/rag/prompts.py`)는 챗 경로 밖임
- 조치 방향: 프로필에서 값을 결정적으로 선채움하고 출처를 `calculation_assumptions`에 남김. `first_startup`은 기본값과 가정 문구를 추가함. `fallback_answer` 호출 시에도 요구를 최대 2개로 자름

### 45. AI 답변이 느림 — 일부 해결

- 요청 경로: `AiConsult.ask` → `api.chat` → `Backend/api/chat.py` → `Backend/core/llm_client.py` → `LLM/src/serving/rag_routes.py` → `graph.ainvoke`
- 해결된 것
  - 분류성 호출에 `reasoning_effort="low"` 적용(`graph.py:521`, `0a262be`·`5bda8bf`)
  - 프론트 챗 타임아웃을 서버 예산에 맞추고 진행 상황 문구를 표시함(`e619d23`)
  - 대화 이력이 있어도 지시어가 없고 주제어가 있는 독립 질문은 문맥 복원 LLM 호출을 건너뜀(`_tax_question_needs_contextualization` 등, `graph.py:394`·`:674`, `c1eae08`)

**남은 원인**

1. **결과가 버려지는 호출이 있음.** `_route_for_category`(`graph.py:468`)가 `tax`·`expense`를 무조건 `tax`로 확정하는데 그 앞의 라우터 LLM 호출(`graph.py:731`)은 그대로 돎
2. **요청마다 객체를 새로 만듦.** `rag_routes.py:861`의 `build_graph(...)`와 `rag_runtime.llm_factory()`(새 `ChatOpenAI`·httpx 클라이언트), `LLM/src/rag/reranker.py:44`의 `cohere.ClientV2`, `LLM/src/core/database.py`의 커넥션(풀 없음)
3. **스트리밍이 없음.** LLM은 `chain.ainvoke` + `with_structured_output`, Backend는 응답 본문을 통째로 읽고(`llm_client.py:264`), 프론트는 `res.json()`임. 세 계층의 응답 방식을 모두 바꾸고 구조화 출력 검증과 충돌하므로 범위 밖으로 둠
4. `.env`의 `LANGSMITH_TRACING=true`가 프로세스 환경에 닿으면 모든 체인 단계가 추적을 전송함
5. **첫 검색 fan-out이 늘어남(`c1eae08`, 미측정).** 정책 질문에 정책·지원금 등 키워드가 있으면 첫 검색어가 1개에서 최대 7개(패싯 5 + 개인화 1)로 늘어남(`build_policy_initial_search_queries`, `LLM/src/rag/discovery.py:318`). 창업 감면 세금 질문은 첫 Hop 검색어 5개(`build_tax_initial_search_queries`, `tax.py:289`). 검색어마다 임베딩 API 1회와 DB 연결 1회(`LLM/src/vectorstores/postgres.py:202`)가 발생하고 2번의 풀 부재와 겹침. 근거 부족 응답도 LLM 답변 생성 1회를 추가로 씀

- 조치 방향: 버려지는 라우터 호출을 건너뜀, 요청마다 만들던 그래프·클라이언트를 재사용함, fan-out 구간 지연을 `TAX_LATENCY` 로그와 정책 경로 계측으로 측정한 뒤 검색어 수를 조정함

---

## 2. 확인 결과 문제가 아닌 것

- **계정을 바꿔도 공고·채팅 기록이 같게 보인 것은 결함이 아님(2026-09-14).** DB 사용자는 `demo@demo.com`(id 1)과 비밀번호를 모르는 계정(id 2)뿐이었음. 로그인 폼 기본값(`App.jsx:442-443`)과 카카오·네이버 버튼(`App.jsx:522`)이 모두 demo 계정으로 로그인하므로 사실상 같은 계정이었음. Backend는 채팅·저장 정책·캘린더를 전부 토큰의 user_id로 거름. 확인용 계정 `demo1@demo.com`/`demo1`(id 3)을 가입 API로 추가했고 채팅·저장 목록이 비어 있음을 확인함. 이 계정은 DB 볼륨에만 있고 시드에는 없음. 조사 중 결함 50·51을 발견함
- **`GovExplorer`는 죽은 코드임.** 어디서도 렌더되지 않음. 이 컴포넌트만 보면 공고 목록이 서버에서 온다고 오해하기 쉬움
- **목데이터 폴백이 조용함.** `useApi`(`Frontend/src/api.js`)가 401이나 타임아웃에 말없이 폴백으로 내려감. 백엔드가 없거나 로그인이 풀렸을 때 가짜 데이터가 진짜처럼 보이므로, 이런 모양의 결함 신고는 먼저 이 경로를 의심할 것
- **`POLICY_DISCOVERY_PROMPT`와 `RAG_PROMPT`는 챗 경로 밖임.** 결함 44에 적음
- **`.env`는 git에 추적되지 않음.** 다만 API 키가 평문으로 들어 있으므로 파일을 팀 밖으로 공유할 때 주의가 필요함
- **`DB/scripts/09_normalize_region.sql`은 적용할 필요가 없음.** 수집기가 적재 시 정규화하고 로컬 DB에 비정규 region이 0건임
- **`DB/scripts/10_backfill_bizinfo_region.py`는 실행되지 않은 상태임.** bizinfo 정책 중 `region IS NULL` 1541건. 외부 API 호출이 필요해 별도 작업으로 둠

## 3. 범위 밖으로 남기는 것

- `Backend/api/chat.py`의 `send_message`가 `async def`가 아니고 `Backend/core/llm_client.py`가 블로킹 `urllib`을 씀. 챗 요청 하나가 스레드풀 워커를 최대 120초 점유하고 기본 풀이 40이라 동시 세무 질문이 몰리면 서버 전체가 멈춤. 비동기 HTTP 클라이언트 전환이 필요함
- 토큰 스트리밍(결함 45)
- 서버 기준 대화방. 대화방은 여전히 브라우저 localStorage 경계라 다른 기기에서는 한 방으로 합쳐 보이고, LLM 문맥 복원(`repo.recent_chats`)도 이전 방 대화를 섞음
- 계정별 브라우저 저장의 한계(결함 50·51). 대화방 경계와 로드맵 진행률이 localStorage라 기기·브라우저 간 공유되지 않고 사이트 데이터를 지우면 사라짐. 이전 전역 키 `changeup:chat-rooms:<category>`는 이관되지 않아 기존 방 경계가 한 번 사라짐

## 4. 관련 문서

- 통합 결함 목록(1~42): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 진행 현황: `Docs/STATUS.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md`
- API 규격: `Docs/Design/API_SPEC.md`
- 데이터 구조: `Docs/Design/ERD.md`
