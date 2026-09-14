# develop 시연 결함 목록

- 작성일: 2026-09-14
- 기준 브랜치/커밋: `develop` / `0f2d1de`
- 범위: 코드 미수정. 조사 결과 기록만 함

## 0. 요약

`develop` 시연 중 사용자가 결함 7건을 보고함. `Docs/reports/INTEGRATION_ISSUES_0910.md`(결함 42건)와 대조했고 중복 없음. 그 리포트는 `feature/integration` 병합 감사가 범위인데 이번 7건은 사용자가 화면을 쓰다 만난 사용성 결함이라 성격이 달라 파일을 나눔. **번호는 0910의 42번에 이어 43~49를 씀.** 두 문서를 함께 읽을 때 겹치지 않게 하기 위함임.

| 번호 | 결함 | 심각도 | 상태 |
| --- | --- | --- | --- |
| 43 | 채팅 말풍선이 마크다운을 평문으로 출력함 | P1 | 미해결 |
| 44 | 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함 | P1 | 미해결 |
| 45 | AI 답변이 느림 | P1 | 미해결 |
| 46 | 상담 기록이 전 카테고리를 평면 나열함 | P2 | 미해결 |
| 47 | 저장한 공고 마감일이 캘린더에 뜨지 않음 | P1 | 미해결 |
| 48 | 저장한 공고 목록이 페이지 이동 시 초기화됨 | P0 | 해결 |
| 49 | 캘린더 일정이 늘면 로드맵 진행률도 증가 | 미확정 | 재현 안 됨 |

조사 결과 7건은 네 갈래 원인으로 모임.

| 원인 | 해당 결함 |
| --- | --- |
| 프론트가 이미 있는 서버 기능을 호출하지 않음 | 47, 48 |
| 렌더링 누락 | 43 |
| LLM 파이프라인이 요청마다 낭비함 | 44, 45 |
| 서버에 대화방 개념이 없음 | 46 |
| 재현 안 됨 | 49 |

| 심각도 | 건수 | 결함 |
| --- | ---: | --- |
| P0 | 1 | 48 |
| P1 | 4 | 43, 44, 45, 47 |
| P2 | 1 | 46 |
| 미확정 | 1 | 49 |

**결함 47과 48은 하나의 원인에서 나온 두 증상임.** 사용자에게는 "저장 목록이 초기화된다"와 "캘린더에 마감일이 안 뜬다"로 따로 보였지만, 둘 다 프론트엔드가 관심 정책 저장을 서버에 보내지 않는 데서 나옴. 0910의 P0-5가 하나의 원인을 세 결함으로 쪼개 오판했던 전례가 있어 먼저 밝힘.

**결함 49는 재현하지 못함.** 소스에 경로가 없어 단정하지 않고 조사 내용과 재현 요청만 남김. 4절 참고.



**결함별 작업 영역**

| 번호 | 결함 | 프론트엔드 | 백엔드 | DB | LLM |
| --- | --- | :-: | :-: | :-: | :-: |
| 48 | 저장한 공고 목록이 페이지 이동 시 초기화됨 | ● | ● | | |
| 43 | 채팅 말풍선이 마크다운을 평문으로 출력함 | ● | | | ○ |
| 44 | 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함 | | | | ● |
| 45 | AI 답변이 느림 | ● | ● | | ● |
| 47 | 저장한 공고 마감일이 캘린더에 뜨지 않음 | ● | | ● | |
| 46 | 상담 기록이 전 카테고리를 평면 나열함 | ● | ○ | ○ | |
| 49 | 캘린더 일정이 늘면 로드맵 진행률도 증가 | ● | | | |

---

## 1. P0 — 데이터가 유실됨

### 48. 저장한 공고 목록이 페이지 이동 시 초기화됨

- 위치: `Frontend/src/App.jsx:1649-1655`, `Frontend/src/App.jsx:3312-3353`
- 증상: 마이페이지에서 공고를 ★로 저장한 뒤 다른 화면에 갔다 돌아오면 목록이 비어 있음. 새로고침해도 사라짐
- 원인: 저장 목록의 유일한 저장소가 `MyPage` 컴포넌트 지역 상태임

```jsx
const [saved, setSaved] = useState(() => new Set());   // App.jsx:1649
```

`toggleSave`(`App.jsx:1650-1655`)는 이 `Set`만 더하고 뺌. 서버 호출도, `localStorage` 기록도 없음.

라우팅이 상태 기반 언마운트임. `App`이 `view`를 `'home' | 'page' | 'mypage'`로 들고 세 갈래 중 하나만 반환하므로(`App.jsx:3312-3353`), `handleNavigate`가 `setView('page')`를 부르는 순간 `MyPage` 서브트리가 통째로 사라지고 돌아올 때 초기화 함수 `() => new Set()`이 다시 돎.

- 서버 쪽은 이미 준비돼 있음. `POST /policies/{policy_id}/save`(`Backend/api/policies.py:92-102`)와 `GET /policies/saved`(`Backend/api/policies.py:63-66`)가 `saved_policies` 테이블(`DB/01_schema.sql:147`)에 쓰고 읽음. **`Frontend/src/api.js:177-202`의 `api` 객체에 두 엔드포인트의 헬퍼가 없어 호출자가 0건임.** 저장 해제 엔드포인트는 아직 없음
- 저장하는 id가 목업임. `MatchedGov`(`App.jsx:1323`)와 `SavedPolicies`(`App.jsx:1401`)가 하드코딩된 `GOV_LISTINGS`(`App.jsx:1860-1874`, id `g1`~`g10`)를 씀. 서버 연동 시 실제 정책 id로 바꿔야 함
- 같은 패턴이 `DeadlinePanel`(`App.jsx:2708`)과 `GovExplorer`(`App.jsx:1879`)에도 각각 따로 있음. 세 곳의 ★ 상태가 서로 무관함
- 조치 방향: 저장 상태를 `App` 최상위로 올리고(`roadmapDone`이 이미 쓰는 방식, `App.jsx:3229`) 서버와 동기화함. `api.js`에 저장·해제·목록 헬퍼를 넣고, 백엔드에 `DELETE /policies/{policy_id}/save`를 추가함. 추천 목록은 목업 대신 `GET /policies/recommendations`를 씀. 응답 `PolicyItem`(`Backend/schemas/policies.py:6-20`)에 `policyId`·`matchScore`·`applyEndDate`가 있어 현재 화면이 쓰는 `id`·`score`·`dday`를 그대로 채울 수 있음
- 조치 결과: 저장 목록을 `App` 상태 `savedPolicies`로 올리고 로그인 시 `GET /policies/saved`로 채움. ★는 `POST`/`DELETE /policies/{policy_id}/save` 성공 후에만 목록을 바꿈. `DELETE` 엔드포인트와 `api.savedPolicies`·`savePolicy`·`unsavePolicy` 헬퍼를 추가함. `MatchedGov`·`SavedPolicies`는 목업 대신 서버 `PolicyItem`을 씀. 테스트 `Backend/tests/test_saved_policies.py`
- 후속 조치: 홈 `DeadlinePanel`의 ★도 같은 `savedPolicies`를 씀. `GET /announcements` 응답에 `policyId`를 추가해 공고 id가 아닌 정책 id로 저장함. 비로그인이면 로그인 모달을 열고, 목데이터 폴백일 때는 ★을 숨김. 저장 성공 후 `GET /policies/saved`로 목록을 다시 받아 마이페이지 표시와 맞춤
- 남은 것: `GovExplorer`는 죽은 코드라 손대지 않음

---

## 2. P1 — 화면·응답 품질

### 43. 채팅 말풍선이 마크다운을 평문으로 출력함

- 위치: `Frontend/src/App.jsx:1017-1018`, `Frontend/src/App.jsx:1037`, `Frontend/src/styles.css:1088-1094`
- 증상: AI 답변에 섞인 `**굵게**`·`###`·`- ` 같은 기호가 그대로 화면에 보이고, 줄바꿈까지 사라져 한 문단으로 뭉쳐 나옴
- 원인: 말풍선이 답변 문자열을 텍스트 노드로 그대로 출력함

```jsx
<div className={`msg msg-in msg--${m.role === 'assistant' ? 'ai' : 'user'}`}>
  {m.content}                                              // App.jsx:1018
</div>
```

파싱이 전혀 없음. `Frontend/package.json:12-19`의 의존성은 `react`·`react-dom` 둘뿐이고 락파일에도 마크다운 라이브러리가 없음. `App.jsx` 전체에 `dangerouslySetInnerHTML`도 없음.

줄바꿈이 사라지는 것은 별개 원인임. `.msg`(`styles.css:1088-1094`)에 `white-space` 규칙이 없어 `\n`이 공백 하나로 합쳐짐. 스타일시트에서 `white-space: pre-wrap`을 쓰는 곳은 `.rg__ai`(`styles.css:2263`, 현재 JSX에서 미사용)와 `.clog__a`(`styles.css:3291-3297`) 둘뿐임. **그래서 상담 기록 화면만 줄바꿈이 살아 있고 채팅 말풍선은 아님.**

- 답변이 실제로 마크다운을 담고 오는 이유: 최종 답변은 `answer_node`(`LLM/src/rag/graph.py:1043`)가 `generate_unified_answer`(`LLM/src/rag/answer.py:57`)로 만듦. 그 프롬프트(`LLM/src/rag/answer.py:33-54`)는 근거 사용과 상태 값만 제약하고 **출력 형식을 전혀 제한하지 않음.** 추론 모델이 목록과 강조를 자연스럽게 씀. Backend는 문자열을 그대로 통과시킴(`Backend/services/chat_service.py:243`)
- 영향 범위가 세 화면임. `AiConsult`가 로드맵 코치(`App.jsx:2361`), 세무 Assistant(`App.jsx:2395`), 공고지원 AI(`App.jsx:2594`) 세 곳에서 쓰임. 말풍선 한 곳을 고치면 세 화면이 함께 고쳐짐
- 렌더 지점은 셋임. 완료된 말풍선(`App.jsx:1018`), 스트리밍 중 말풍선(`App.jsx:1037`), 상담 기록 본문(`App.jsx:1543`)
- 조치 방향: 의존성 추가 없이 경량 렌더러를 만들어 React 엘리먼트로 변환함. `dangerouslySetInnerHTML`을 쓰지 않으므로 XSS 경로가 생기지 않음. 지원 범위는 실제로 오는 형태로 한정함 — 제목, 불릿, 번호 목록, 인용, 코드 펜스, `**굵게**`, 인라인 코드, 링크. 링크는 `http`/`https`만 허용함

### 44. 세액감면 계산이 사용자 입력 6개를 한꺼번에 요구함

- 위치: `LLM/src/rag/graph.py:171-198`, `LLM/src/rag/graph.py:775-788`, `LLM/src/rag/answer.py:112-124`
- 증상: 세액감면을 물으면 답변 대신 확인할 정보 목록만 길게 나옴
- 원인: 프롬프트가 아니라 결정적 테이블임

```python
"startup_tax_reduction": {                    # graph.py:190-197
    "eligible_tax_krw": "감면 적용 전 세액",
    "startup_year": "창업연도",
    "age": "나이 또는 생년월일",
    "business_location": "실제 사업장 위치",
    "industry": "실제 업종",
    "first_startup": "최초 창업 여부와 과거 사업 이력",
},
```

`tax_calculation_plan_node`(`graph.py:775-781`)가 `calculation_inputs`에 없는 항목을 전부 `missing_inputs`에 넣고 `termination_reason="missing_calculation_input"`을 세움. `_answer_status`(`graph.py:1436-1441`)가 이를 `need_more_info`로 바꾸면 **LLM을 아예 건너뛰고** 고정 문자열이 나감.

```python
answer = "정확한 판단을 위해 다음 정보가 필요합니다: " + ", ".join(missing_user_context)
# answer.py:122-124
```

- 기본값으로 요구를 없애는 장치가 하나뿐임. `DEFAULT_CALCULATION_INPUTS`(`graph.py:200-208`)에 `withholding_tax`만 있음. 나머지 7개 계산 타입은 비어 있음
- **6개 중 4개는 물을 필요가 없음.** `state["user_context"]`가 `UserProfile`(`LLM/src/data/contracts.py:13-19`)이라 `age`, `region`, `business.industry`, `business.founded_at`을 이미 들고 있음. 각각 `age`, `business_location`, `industry`, `startup_year`로 매핑 가능함. Backend가 이 값을 실어 보내는 것은 `Docs/STATUS.md` P0-2-1에서 이미 고쳐짐
- 요구를 만드는 프롬프트는 `CALCULATION_INPUT_PROMPT`(`LLM/src/rag/tax.py:176-209`)와 `EVIDENCE_PROMPT`(`LLM/src/rag/tax.py:133-156`)임. 후자가 만든 `missing_user_context`가 비어 있지 않으면 `graph.py:893-894`가 무조건 종료시킴
- **헛짚기 쉬운 곳을 미리 적어 둠.** `POLICY_DISCOVERY_PROMPT`(`LLM/src/rag/prompts.py:43-164`)는 42개 규칙에 `requirements_to_verify`(`prompts.py:124-134`)와 곳곳의 `"확인 필요"`(`prompts.py:60`, `:97`)까지 담고 있어 원인처럼 보임. **그러나 챗 경로에 없음.** `PolicyDiscoveryService`(`LLM/src/rag/discovery.py:39`)를 통해 `POST /internal/rag/recommendations`(`LLM/src/serving/rag_routes.py:965-991`)에서만 도달함. 같은 이유로 `RAG_PROMPT`(`prompts.py:11-40`)도 챗 경로 밖임. 이 둘을 고쳐도 증상이 바뀌지 않음
- 조치 방향: 프로필에서 값을 선채움하고 출처를 `calculation_assumptions`에 남김. `first_startup`은 기본값과 가정 문구를 `DEFAULT_CALCULATION_INPUTS`에 추가함. 남은 요구는 한 번에 최대 2개로 자름. 그러면 `startup_tax_reduction`에서 실제로 물을 것은 `eligible_tax_krw` 하나가 됨

### 45. AI 답변이 느림

- 요청 경로: `Frontend/src/App.jsx:856` → `Frontend/src/api.js:197` → `Backend/api/chat.py:29` → `Backend/core/llm_client.py:93` → `LLM/src/serving/rag_routes.py:467` → `graph.ainvoke`(`rag_routes.py:856`)
- 증상: 특히 세무 질문이 오래 걸리고, 그동안 화면에 아무것도 나오지 않음

**메시지당 모델 호출 횟수**

| 카테고리 | 경로 | 채팅 완성 | 임베딩 | Cohere |
| --- | --- | ---: | ---: | ---: |
| `roadmap` | `roadmap_coach` | 1 | 0 | 0 |
| `policy` | guardrail → contextualize → router → policy → answer | 2~3 | 1 | 1 |
| `tax`·`expense`·`saving` | `_route_for_category`가 tax 멀티홉으로 확정 | 최대 10 | 최대 3 | 최대 3 |

세무 최악의 경우가 전부 직렬임. contextualize(`graph.py:558`) → router(`:623`) → `tax_intent`(`:715`) → `tax_calculation_plan`(`:740`) → {retrieval → evidence → next_query} × `TAX_MAX_HOPS=3` → answer(`:1043`).

**원인별 정리**

1. **추론 강도가 설정되지 않음.** `.env`의 `LLM_MODEL=gpt-5.6-luna`는 추론 모델인데 `LLM/src/models/factory.py:33-37`의 `ChatOpenAI`에 `reasoning_effort`도 `timeout`도 `max_retries`도 없음. 명시한 곳은 `LLM/src/rag/roadmap.py:31-32`(`ROADMAP_REASONING_EFFORT = "low"`) 하나뿐임. 라우터·문맥 복원 같은 분류성 호출까지 기본 강도로 돎
2. **결과가 버려지는 호출이 있음.** `_route_for_category`(`graph.py:357-368`)가 `tax`·`expense`를 무조건 `tax`로 확정하는데, 그 앞의 라우터 LLM 호출(`graph.py:623`, `route_question` `:332-354`)은 그대로 돎. 이 두 카테고리에서 판정 결과는 전부 버려짐
3. **요청마다 객체를 새로 만듦**

   | 위치 | 매 요청 재생성 |
   | --- | --- |
   | `LLM/src/serving/rag_routes.py:849-855` | `build_graph(...)` → `graph.compile()` |
   | `LLM/src/serving/rag_routes.py:850` | `ChatOpenAI` 객체. 새 httpx 클라이언트와 TLS 핸드셰이크 |
   | `LLM/src/rag/reranker.py:44-46` | `cohere.ClientV2(...)` |
   | `LLM/src/vectorstores/postgres.py:201` | psycopg 커넥션. 풀 없음 |

4. **스트리밍이 없음.** 전 계층이 버퍼링임. LLM은 `chain.ainvoke` + `with_structured_output`(`answer.py:71-73`), Backend는 응답 본문을 통째로 읽고(`llm_client.py:265`), 프론트는 `res.json()`(`api.js:95`)임. 마지막 토큰까지 화면이 비어 있음
5. **타임아웃 층이 어긋나 있음.** `apiPost` 기본값이 30초(`Frontend/src/api.js:82`)인데 `api.chat`(`api.js:197`)도 호출부(`App.jsx:856`)도 이를 덮지 않음. Backend의 `LLM_TIMEOUT_CHAT_TAX`는 120초임(`Backend/core/config.py:73`). 세무 질문이 30초를 넘으면 서버가 아직 답하는 중에 브라우저가 먼저 끊어 사용자에게는 실패로 보임. `Docs/STATUS.md` 2절 미해결 2와 같은 건임
6. 커밋 `e7dd403`이 `LLM_TIMEOUT_CHAT_POLICY`를 30→45초로 올려(`Backend/core/config.py:72`) 이 간극이 더 벌어짐. 같은 커밋이 `ROADMAP_MAX_COMPLETION_TOKENS`를 900→4000으로 올렸는데, 추론 토큰이 이 상한에 함께 계산되므로 긴 추론이 더는 잘리지 않음
7. `.env`의 `LANGSMITH_TRACING=true`가 프로세스 환경에 닿으면 모든 체인 단계가 추적을 전송함

- 조치 방향: 저위험 항목만 손댐. 추론 강도를 설정에 넣고 분류성 호출은 더 낮게 씀, 버려지는 라우터 호출을 건너뜀, 요청마다 만들던 객체를 재사용함, 프론트 타임아웃을 서버 예산에 맞춤. 스트리밍은 세 계층의 응답 방식을 모두 바꾸고 구조화 출력 검증과 충돌하므로 이번 범위에서 제외함
- 함께 적을 것: `Backend/api/chat.py:30`이 `async def`가 아니고 `llm_client`가 블로킹 `urllib`을 씀(`llm_client.py:264`). 진행 중인 챗 요청 하나가 스레드풀 워커를 최대 120초 점유함. 7절 참고

### 47. 저장한 공고 마감일이 캘린더에 뜨지 않음

- 위치: `Frontend/src/App.jsx:1138-1145`, `Frontend/src/App.jsx:2845-2863`, `Backend/services/calendar_service.py:30-45`, `docker-compose.yml:70-71`
- 증상: 캘린더에 직접 추가한 일정만 보이고 저장한 공고의 마감일은 보이지 않음
- 원인이 세 겹임. **셋 다 독립적으로 막고 있어 하나만 고쳐도 화면은 그대로임**

**첫째, 저장이 서버에 도달하지 않음.** 결함 48 때문임. 서버는 저장한 정책이거나 마감 전인 POLICY 일정만 노출함.

```python
saved_ids = repo.saved_policy_ids(user_id)          # calendar_service.py:33
if event.get("policy_id") not in saved_ids and not (due and due >= today):
    continue                                        # calendar_service.py:40-41
```

프론트가 저장을 보내지 않으니 `saved_ids`가 늘 비어 있고 이 경로가 끝까지 죽어 있음.

**둘째, 마이페이지 캘린더가 내 일정만 남기고 나머지를 버림.**

```jsx
const mine = arr.filter((e) => e.mine);             // App.jsx:1141
```

서버가 내려준 세금 신고일과 정책 마감일이 렌더 전에 전부 걸러짐. **사용자가 "직접 추가한 것만 나온다"고 본 화면이 여기임.** 바로 위 주석(`App.jsx:1137`)이 "공고 마감·세금 신고일은 공고지원 AI 화면에서 확인"이라고 적고 있어 의도된 필터로 보이나, 그 결과가 사용자 기대와 어긋남.

**셋째, POLICY 캘린더 행 자체가 없을 수 있음.** `DB/scripts/08_link_policy_calendar.sql`이 공고 마감일을 `calendar_events`의 POLICY 행으로 옮기는데, `docker-compose.yml:70-71`이 `01_schema.sql`과 `app_extras.sql`만 initdb에 마운트함. **0910 리포트 결함 31과 같은 건이며 아직 미해결임.**

- 공고지원 AI 화면 쪽도 마감일을 보여주지 못함. 그 화면의 `Calendar`(`App.jsx:2865`)는 읽기 전용이고, `compact` 플래그가 이벤트 목록 전체를 숨겨(`App.jsx:2945`) 날짜 칸의 색 점만 남음. `pickImportant`(`App.jsx:2845-2863`)가 하루 2건·정책 마감 2건으로 잘라 개인 일정이 가려질 수도 있음
- 마이페이지의 일정 저장 경로 자체는 정상임. `addEvent`(`App.jsx:1165-1185`)가 `POST /calendar`를 부르고, 서버가 `event_type='USER'`로 저장하며(`Backend/services/calendar_service.py:54-73`), `mine` 판정(`calendar_service.py:16`)도 맞음
- 조치 방향: 결함 48을 먼저 고침. 그 뒤 마이페이지 캘린더가 세 종류를 모두 보여주도록 필터를 풀고 타입 배지로 구분함. `08_link_policy_calendar.sql`을 compose initdb에 마운트하고, 기존 볼륨에는 `setup.sh`·`setup.bat`에서 `app_extras.sql` 재적용 직후에 함께 적용함. 스크립트가 `NOT EXISTS`로 감싸여 있어 재실행에 안전함

---

## 3. P2 — 설계 한계

### 46. 상담 기록이 전 카테고리를 평면 나열함

사용자 질문은 "의도한 부분인지"였음. **의도된 설계가 아니라 한계임.**

- 위치: `Frontend/src/App.jsx:1496-1554`, `DB/01_schema.sql:33-40`
- 증상: 마이페이지 상담 기록이 대화방 구분 없이 모든 질문·답변을 한 줄씩 나열함. 세무·공고·로드맵 대화가 섞임
- 원인: **서버에 대화방 개념이 없음.** `chat_messages`에 세션 컬럼이 없음

```sql
CREATE TABLE chat_messages (          -- DB/01_schema.sql:33-40
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(id) ON DELETE CASCADE,
    category   VARCHAR(50),
    question   TEXT,
    answer     TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

한 행에 질문과 답변이 함께 들어가고, 구분할 수 있는 축은 `category` 하나임. `GET /chat/messages`(`Backend/api/chat.py:40-46`)도 `category` 필터만 받고 `repo.list_chats`(`Backend/core/repo.py:155-164`)가 평면 목록을 돌려줌. 사실상 사용자·카테고리당 무한 스레드 하나임.

- **채팅 화면의 "방"은 서버에 없음.** 프론트가 브라우저에만 만들어 둔 것임. `App.jsx:667-688`의 주석이 이를 명시함. "새 대화"를 누른 시점의 마지막 메시지 id를 `changeup:chat-rooms:<category>` 키(`App.jsx:673`)로 저장하고, 기록을 불러올 때 그 경계로 나눠 보여줌(`App.jsx:733-742`)
- **상담 기록 화면은 그 경계를 쓰지 않음.** `ChatLog`가 `loadRooms`를 부르지 않고, `api.chatHistory()`를 **카테고리 인자 없이** 호출함

```jsx
api.chatHistory()                     // App.jsx:1508 — 필터 없음
```

그래서 전 카테고리가 섞인 채 역순으로 한 줄씩 나옴(`App.jsx:1536-1549`).

- 응답이 원본 DB 컬럼 그대로임. `GET /chat/messages`에 `response_model`이 없어 `SELECT *` 결과의 snake_case 키가 그대로 나감. 프론트가 `row.created_at`을 읽는 이유임(`App.jsx:1543-1546`)
- LLM의 대화 문맥도 같은 한계를 가짐. `chat_service._conversation_history`(`Backend/services/chat_service.py:140-177`)가 `repo.recent_chats(user_id, category, limit)`로 최근 N쌍을 복원함. 방 개념이 없으므로 이전 방의 대화가 다음 방 문맥에 섞임
- 조치 방향 둘 중 선택이 필요함
  - **프론트만 고침**: `ChatLog`가 카테고리별로 조회하고 기존 `loadRooms`와 방 분할 로직을 재사용함. 서버·DB 변경 없음. 다른 기기에서는 경계가 없어 한 방으로 합쳐 보임
  - **서버 기준 대화방**: `chat_messages`에 세션 컬럼을 넣음. `repo.recent_chats`·`list_chats`와 `Backend/tests/test_chat_history.py`·`Backend/tests/test_repo_recent_chats.py`가 함께 바뀜. 기기가 달라도 방이 유지됨

---

## 4. 재현되지 않은 건

### 49. 캘린더 일정이 늘면 로드맵 진행률도 증가

- 보고 내용: 마이페이지 캘린더에 일정을 추가하면 창업 로드맵 진행률도 함께 오름
- **현재 소스에서 재현 경로를 찾지 못함.** 단정하지 않고 확인한 것만 남김

**확인한 것**

- 진행률의 유일한 근거는 `roadmapDone`임. `App`의 `useState({})`(`App.jsx:3229`)이고 키 형식은 `단계:인덱스`
- **쓰는 곳이 하나뿐임.** `RoadmapGuide`의 체크박스 `toggle`(`App.jsx:2271-2272`)임

```jsx
setDone((d) => ({ ...d, [`${active}:${i}`]: !d[`${active}:${i}`] }));
```

- `setRoadmapDone`이 전달되는 경로도 하나임. `App`(`:3347`) → `SubPage`(`:2635`) → `RoadmapGuide`. 파일 전체 검색에서 `roadmapDone`·`setDone`은 `:1646`, `:1658-1667`, `:2254`, `:2611`, `:2634-2635`, `:3229`, `:3326`, `:3346-3347`에만 나타남
- `MpCalendar`(`App.jsx:1119-1268`)는 이 상태를 건드리지 않음. 자기 지역 상태(`ftitle`, `ftype`, `reload`, `calErr`)와 서버만 씀
- 진행률 계산은 두 곳에 중복돼 있고 식이 같음. 마이페이지 카드(`App.jsx:1664`)와 로드맵 화면(`App.jsx:2268`) 모두 `Object.values(roadmapDone).filter(Boolean).length`임
- `Frontend/dist/assets/index-7XCnyrJg.js`가 `Frontend/src/App.jsx`보다 하루 오래됨. 번들을 풀어 보니 계산식은 소스와 같았으나 **빌드가 최소 한 세대 뒤처져 있음**

**같은 증상을 만들 수 있는 취약점 둘**

원인으로 단정하지는 않되, 고쳐 둘 값어치가 있어 함께 적음.

1. **키를 검증하지 않음.** 두 계산 모두 객체의 모든 참값을 셈. `ROADMAP_TASKS`에 없는 키가 어떤 경로로든 `roadmapDone`에 들어가면 진행률이 부풀고 100%를 넘길 수 있음
2. **어디에도 저장되지 않음.** `roadmapDone`이 순수 `useState({})`라 새로고침마다 사라짐. 사용자가 "진행률이 제멋대로"로 읽기 쉬움

**재현 요청**

다음 세 가지를 확인해 주시면 좋겠음.

- 개발 서버(`npm run dev`)인지 배포본(`Frontend/dist` 또는 docker frontend 컨테이너)인지
- 로드맵 체크박스를 한 번도 누르지 않은 상태에서 진행률이 0%가 아니었는지
- 늘어난 것이 퍼센트 숫자인지, 카드 오른쪽의 `N / 7단계` 표시인지, 캘린더의 "이번 달 일정 N건"(`App.jsx:1209`)인지

---

## 5. 함께 확인했으나 이번 7건이 아닌 것

0910 리포트 6절과 같은 취지임. 다음 조사에서 결함으로 다시 잡히지 않도록 남김.

- **`GovExplorer`(`App.jsx:1875-2001`)는 죽은 코드임.** 어디서도 렌더되지 않음. 이 컴포넌트만 `/announcements`를 실제로 호출하므로, 코드만 읽으면 공고 목록이 서버에서 온다고 오해하기 쉬움
- **목데이터 폴백이 조용함.** `useApi`(`api.js:212-251`)가 401이나 타임아웃에 말없이 폴백으로 내려감. `Calendar`(`App.jsx:2874`, `CAL_EVENTS`는 2025년 10~11월 고정값), `DeadlinePanel`(`:2697`), `MatchedGov`(`:1325`)가 해당됨. 백엔드가 없거나 로그인이 풀렸을 때 가짜 데이터가 진짜처럼 보이므로, 이런 모양의 결함 신고는 먼저 이 경로를 의심할 것
- **`POLICY_DISCOVERY_PROMPT`와 `RAG_PROMPT`는 챗 경로 밖임.** 결함 44에 적음
- **`.env`는 git에 추적되지 않음.** `.gitignore`에 있고 `git ls-files`로 확인함. 다만 `COHERE_API_KEY`와 `LANGSMITH_API_KEY`가 평문으로 들어 있으므로 파일을 팀 밖으로 공유할 때 주의가 필요함
- **마이페이지 일정 저장·삭제 경로는 정상임.** 결함 47에 적음

## 6. 다른 문서와의 관계

- **0910 리포트 결함 31**(`08_link_policy_calendar.sql` 미마운트)이 이번 결함 47의 세 번째 겹임. 해결 시 양쪽에 함께 기록할 것
- **`Docs/STATUS.md` 2절 미해결 2**(프론트 `apiPost` 타임아웃이 서버 예산보다 짧음)가 이번 결함 45의 다섯 번째 항목과 같은 건임. 그 문서는 "실측 최대가 11.7초라 지금은 걸리지 않는다"고 적었으나, 사용자가 느리다고 보고한 지금은 걸릴 수 있음
- **`Docs/STATUS.md` 2절 미해결 1**(공고문 요약 호출자 부재, 0910 결함 40)은 이번 7건과 무관하며 그대로 미해결임

## 7. 범위 밖으로 남기는 것

- `Backend/api/chat.py:30`이 `async def`가 아니고 `Backend/core/llm_client.py:264`가 블로킹 `urllib`을 씀. 챗 요청 하나가 FastAPI 스레드풀 워커를 최대 120초 점유함. 기본 풀이 40이라 동시 세무 질문이 몰리면 서버 전체가 멈춤. 비동기 HTTP 클라이언트 전환이 필요해 별도 작업으로 둠
- 토큰 스트리밍. 결함 45에 적음
- 서버 기준 대화방. 결함 46에 적음

## 8. 관련 문서

- 통합 결함 목록(42건): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 진행 현황: `Docs/STATUS.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md`
- API 규격: `Docs/Design/API_SPEC.md`
- 데이터 구조: `Docs/Design/ERD.md`
