# 진행 현황

- 갱신일: 2026-09-10
- 기준 브랜치/커밋: `feature/integration` / `b56b85d`

`Docs/TODO.md`가 전체 작업 흐름과 체크리스트라면, 이 문서는 현재 코드 기준의 실제 상태와 미해결 이슈를 정리한 것이다.

## 1. 병합 현황

| 브랜치 | 병합 커밋 | 비고 |
| --- | --- | --- |
| `feature/data-collection` | `7286a9d` (PR #9) | 세법·정책 수집 스크립트 |
| `feature/backend` | `c921867` (PR #10) | Backend API 서버 |
| `feature/LLM-connect-test` | `21c79f9` (PR #11) | LLM RAG(LangGraph) 구현 |
| `feature/data-collection` | `2bbbf3b` (PR #12) | `app_extras.sql`, HNSW 인덱스, API 키 로그 노출 수정 |
| `feature/intergration` | `8b3f0ef` (PR #13) | 서비스 간 배선, Backend 덤프 제거, 설계 문서 동기화 |
| `feature/data-collection` | `720e16f` (PR #14) | `09_add_rag_columns.sql` 삭제 및 `run_all` 호출 제거 |
| `feature/LLM-connect-test` | `763f265` (PR #17) | LLM V1 엔드포인트 4개 구현, Backend 연동 보완 |
| `feat/frontend` | `72c4b0e` (PR #19) | 창업ON 프론트엔드(React 18 + Vite) |
| `feature/backend` | `a01a503` | P1-1 DB 직접 조회 전환. `feature/integration`으로 직접 병합 |

병합 자체는 정상임. 충돌 마커 없음. 코드 유실 없음. 잔존 `store` 참조·누락 심볼·시그니처 불일치도 0건임.

P0-1, P0-2-1, P0-3, P0-4, P1-1, P1-2, P2-1이 해결됨. 남은 것은 P0-5(프론트엔드 미연동), P0-6(보안 2건), P1-3(규모·부트스트랩)임. 상세 결함 목록은 `Docs/reports/INTEGRATION_ISSUES_0910.md`에 있으며 33건 중 6건 해결·1건 오탐 정정·26건 미해결임. `Docs/TODO.md`의 "구현 → 서비스 간 연동"은 남은 셋이 끝나야 완료로 볼 수 있음.

## 2. 미해결 이슈

### P0-1. 서비스 간 통신 미배선 — 해결됨

- `docker-compose.yml`의 `backend`에 `ports`·`env_file`·`depends_on` 없음. `llm`에도 `env_file` 없음. 두 컨테이너에 애플리케이션 환경변수가 전혀 주입되지 않음
- `Backend/core/config.py:39` `LLM_API_URL` 기본값이 `http://127.0.0.1:8001`. 컨테이너 안에서는 자기 자신을 가리킴. 설계상 값은 `http://llm:8001` (`Docs/Design/ARCHITECTURE.md` §1)
- `Backend/core/config.py:41` `DATABASE_URL` 기본값도 `127.0.0.1`. Backend는 `.env`를 읽지 않아(`Backend/` 전체에 `load_dotenv` 없음) Postgres 연결 실패 시 SQLite로 내려감
- `LLM/src/core/config.py:10`의 `ROOT_ENV_FILE`이 컨테이너에서 `/.env`로 해석되고, `LLM/.dockerignore:5`가 `.env`를 제외함. LLM 컨테이너는 환경 파일을 하나도 읽지 못함
- 포트 번호 자체는 8001로 일치함. 어긋난 것은 호스트명뿐임

**조치 (PR #13)**

- `backend`에 `ports: "8000:8000"`, `environment`(`LLM_API_URL`·`DATABASE_URL`·`TOKEN_SECRET`·`LLM_TIMEOUT_SECONDS`), `depends_on` 추가. `env_file`은 쓰지 않아 OpenAI·Cohere 키가 Backend로 새지 않음
- `llm`에 `env_file: .env` 추가. 모델·검색·LangSmith까지 15개 이상을 읽으므로 통째로 넘기고 `environment`로 DB 관련만 덮어씀
- `db`에 `pg_isready` 헬스체크 추가. 없으면 Backend가 Postgres 기동 전에 붙으려다 실패하고 `Backend/core/database.py`가 조용히 SQLite로 내려감
- `Backend/Dockerfile`에 `UV_PROJECT_ENVIRONMENT=/opt/backend-venv` 추가. 바인드 마운트가 `/app/.venv`를 가려 컨테이너 기동 때마다 의존성을 재해석하던 문제
- `.env.example`에 누락 변수 9개 추가. `TOKEN_SECRET`에는 `:-` 기본값을 둠. 빈 문자열이 주입되면 `Backend/core/config.py:29`의 `os.getenv` 기본값이 무시돼 서명 키가 공백이 됨
- 코드의 `localhost` 기본값은 유지함. 서비스명은 compose가 주입하므로 `LLM/RUN_GUIDE.md`의 로컬 실행 절차가 그대로 동작함
- 설계 문서의 포트 표기 정정. `Docs/Design/ARCHITECTURE.md:27`과 `Docs/tech-stack.md`의 예시 URL을 8001로, `Docs/Design/LLM_API_SPEC.md`의 "코드가 아직 8000" 경고 2곳은 사실이 아니어서 삭제

**DB 선택**

검증용 DB는 compose의 `db` 컨테이너가 기본값이다. 외부 DB 전환은 `COMPOSE_DB_HOST`를 명시할 때만 일어난다. 작업 당시에는 팀 공용 DB에 붙으면 P0-3 `TRUNCATE`이 데이터를 지웠기 때문이며, P0-3 해결 후에도 안전한 기본값을 유지한다.

**검증**

`docker compose up -d --build` 후 db healthy, backend·llm running.

```json
{"status":"ok","storage":"sqlite-loaded","postgres":"connected","pgvector":"ready",
 "ragChunks":10523,"llm":"connected","llmUrl":"http://llm:8001"}
```

- 컨테이너 간 `http://llm:8001/health` → 200
- `curl localhost:8001/health` → `llm: configured`, `embedding: configured`, `data_source: postgres`
- backend가 보는 DB는 `db:5432/startup_platform`. 외부 DB 아님
- LLM 테스트 182 통과 8 실패. 실패는 전부 `LLM/src/data/RAG_data` 원본 PDF 부재 때문이며 이 작업과 무관함 (`LLM/RUN_GUIDE.md` 8절)

### P0-2. LLM 엔드포인트 미구현 — 해결됨

**조치 (PR #17)**

LLM이 없던 엔드포인트 4개를 구현했고 `Docs/Design/LLM_API_SPEC_V1.md`가 확정 계약으로 올라옴.

| Endpoint | 영향 기능 |
| --- | --- |
| `POST /rag/legal-basis` | FS-13 세액감면 근거 |
| `POST /ocr/receipt` | FS-15 영수증 OCR |
| `POST /rag/deductibility` | FS-17 경비처리 가능성 |
| `POST /rag/summarize-announcement` | FS-22 공고문 요약 |

- `RagChatResponse`에 `guardrail_reason` 추가. `Backend/services/chat_service.py:93,99`의 죽어 있던 분기가 살아남
- `Backend/core/llm_client.py`에 로깅 추가. `HTTPError`와 전송 오류를 분리하고 `error.code`·`retryable`를 기록함. 키와 요청 본문은 남기지 않음
- 빈 문자열로 422가 나던 경로 정리. `explain_expense()`가 `category`·`vendor`를 정규화하고, 본문이 빈 공고 요약은 호출 전에 차단함

### P0-2-1. Backend가 V1 계약을 준수하지 않음 — 해결됨

2026-09-10 `feature/integration`에서 9개 항목 전부 수정함. LLM은 손대지 않았고, 어긋난 쪽인 Backend만 계약에 맞춤.

**조치**

| 항목 | 조치 |
| --- | --- |
| `/internal/*` fallback 8곳 잔존 | 전부 삭제. `Backend/`에 `/internal/` 문자열이 남지 않음. 그중 `/internal/ocr/receipt`·`/internal/summarize/announcement`·`/internal/explain/tax-reduction`은 LLM에 라우터 자체가 없어 확정 404였음 |
| 엔드포인트별 timeout 미적용 | `core/config.py`에 `LLM_TIMEOUT_*` 상수 8개 추가. V1 §9 표를 그대로 옮기되 `/rag/chat`만 카테고리별로 나눔 |
| 콜드 스타트에 `/rag/chat`을 호출하지 않음 | `rag_answer`에서 `ensure_index()` 선확인을 제거함. `/rag/chat`은 인덱스가 없어도 409가 아니라 200 + `status="integration_unavailable"`을 주므로 판단을 응답에 맡김. 질의당 `/rag/ready` 왕복도 함께 사라짐 |
| `userContext` 미전송 | `chat_service._user_context()` 신설. `BackendUserContext`가 `extra="forbid"`라 필드를 하나씩 구성하고 날짜는 `YYYY-MM-DD`로 직렬화함. `age`는 계약 범위(0~150) 밖이면 `null`로 보냄 |
| `noticeResults` 미전송 | `repo.open_announcements()`와 `chat_service._notice_results()` 신설. 마감 안 지난 공고 20건을 마감 임박순으로 보냄. `category="policy"`에는 항상 보냄 |
| `/rag/deductibility` 응답의 `sources`를 `[]`로 덮어씀 | 응답의 `sources`를 그대로 전달. `grounded`·`status`·`llmUsed`도 함께 넘김 |
| `sources[].url` 대신 `source`를 URL로 사용 | `url`을 `url`로 매핑 |
| `status`·`llmUsed` 미사용 | `send_message`가 `status` 6종을 분기함. `integration_unavailable`·`error`는 목업 폴백, `success`만 `needsConfirmation=false`. 범위 밖 질문은 `guardrail_reason="out_of_scope"`로 구분함. 경비 판단은 응답의 `llmUsed`를 그대로 씀 |
| 관리자 재색인이 실제로 돌지 않음 | `ensure_index`를 `reindex`로 정리하고 준비 상태 선확인을 제거함. 실패 시 502를 반환함 |

**타임아웃 값**

`/health`·`/rag/ready` 3초, `/rag/chat` policy 30초·tax·expense·saving 120초, `/rag/legal-basis`·`/rag/deductibility` 30초, `/rag/summarize-announcement` 45초, `/ocr/receipt` 60초, `/rag/reindex` 180초.

`/rag/chat`이 갈리는 이유는 LLM의 `_route_for_category`가 `tax`·`expense`를 tax 멀티홉으로 강제하기 때문임. V1 §9는 30초 일괄이지만 인계서 4절이 Tax에 120초를 제시하며 미합의로 남겨 둔 항목이라, 실측값을 반영하되 `policy`는 계약값을 유지함. 결정을 `BACKEND_LLM_INTEGRATION_HANDOFF.md` 1절에 기록함. `LLM_TIMEOUT_SECONDS`는 명시 제한이 없는 호출의 기본값으로만 남음.

**검증**

LLM을 stub으로 대체해 요청 구성과 응답 해석을 확인함.

- 요청 경로·타임아웃 11건이 V1 §9 표와 일치. `/internal/*` 호출 0건
- `userContext` 7필드, `noticeResults` 8필드가 계약 필드명과 정확히 일치함. `extra="forbid"`라 하나만 틀려도 422이므로 집합 비교로 확인함
- `status` 6종 + LLM 완전 장애까지 7가지 경로의 `llmUsed`·`grounded`·`needsConfirmation` 조합 확인
- 저장된 `answer_sources.url`이 문서 이름이 아니라 실제 URL임
- `open_announcements()` 쿼리를 실데이터 Postgres에서 확인함. 전체 공고 1,812건 중 마감 안 지난 것 841건이고 제목·날짜가 계약 형식에 맞음

**남은 합의 항목** (`BACKEND_LLM_INTEGRATION_HANDOFF.md` 1절)

1. `category`를 Router 힌트로 둘지 허용 route 제약으로 쓸지. 코드와 V1은 이미 제약이며 이에 맞춰 `LLM/LANGGRAPH_ARCHITECTURE.md`를 정정했음. 다만 Backend의 `/rag/chat` 타임아웃 분기가 이 강제 동작을 전제하므로, 힌트로 바뀌면 타임아웃 정책도 함께 재검토해야 함
2. `/rag/reindex`의 `documentIds`가 원천 문서 ID인지 `rag_documents.id`인지. 확정 전까지 `[]`(전체 재색인)만 보냄. 현재 코드가 요청 본문을 무시하고 항상 `[]`을 보내도록 고정했음
3. 영수증 지원 형식과 4 MiB 제한을 정식 계약으로 확정할지

**검증 미실시**

인계서는 LLM 전체 테스트가 `222 passed`라고 적었으나 확인하지 않았음. `develop`에서 직접 측정한 값은 182 통과 8 실패이며 실패는 전부 `LLM/src/data/RAG_data` 원본 PDF 부재 때문임. PDF는 테스트 전용이고 `VECTOR_STORE_BACKEND=postgres`인 실제 구성에는 필요 없음.

실 LLM 컨테이너를 띄운 종단 확인은 아직 하지 않았음. `Docs/reports/INTEGRATION_ISSUES_0910.md` 4절의 재현 절차를 그대로 쓰면 됨.

### P0-3. Backend 쓰기가 벡터 인덱스를 삭제 — 해결됨

**있었던 문제**

- `Backend/core/postgres.py`의 `save_postgres()`가 `TRUNCATE ... RESTART IDENTITY CASCADE`로 시작하고 대상에 `policies`가 있었음
- `rag_documents.policy_id`가 `policies(id)`를 참조(`DB/01_schema.sql:170`)하므로 CASCADE가 `rag_documents`까지 비움
- 이 경로를 타는 `persist()` 호출이 Backend 전체에 25곳이었음

**원인**

`TRUNCATE`은 독립된 결함이 아니라 덤프 설계의 부품이었음. `persist()`는 인자가 없어 "무엇이 바뀌었는지" 모르고, 할 수 있는 일이 store 전체를 다시 쓰는 것뿐이었음. 그리고 모든 INSERT가 `id`를 명시해 두 번째 호출부터 기본키가 충돌하므로, 쓰기 전에 테이블을 비워야만 했음.

**조치 (2026-09-09)**

덤프 자체를 제거함. `save_postgres()`, `load_postgres()`, `init_postgres()`, `persist_postgres()`와 전용 헬퍼를 삭제하고 `Backend/core/postgres.py`를 481줄에서 65줄로 줄임. 남긴 것은 `_connect()`와 `postgres_status()` 두 개이며 `/health`만 사용함. `Backend/core/database.py`의 `init_db()`·`persist()`에서 Postgres 호출을 끊음.

**회귀가 없는 이유**

`save_postgres()`는 한 번도 성공한 적이 없었음. `TRUNCATE` 대상 첫 항목 `notifications`가 `01_schema.sql`에 없어 Postgres가 구문 전체를 거부했고 예외는 삼켜졌음. 따라서 Backend는 원래부터 SQLite로만 동작하고 있었고, 코드를 지워도 달라지는 것이 없음.

**검증**

정책 2,534건 · 청크 10,523건 · 세법 4,459건이 든 로컬 DB에서 확인함.

- `grep -rn "TRUNCATE\|save_postgres\|load_postgres\|persist_postgres" Backend/` 결과 없음
- 로그인과 챗봇 질의로 쓰기를 발생시킨 뒤에도 건수 전부 그대로
- `POST /chat/messages`(policy)가 `llmUsed: true`, `grounded: true` 유지
- `docker compose restart backend` 후에도 로그인 성공. SQLite 영속성은 그대로
- `/health`에 `ragChunks` 추가. `postgres_status()`가 세던 테이블이 존재하지 않는 `rag_chunks`여서 항상 0이었으므로 `rag_documents`로 정정함

**부수 효과**

`storage`가 항상 `sqlite-*`로 나옴. Backend가 Postgres에 쓰지 않는다는 실제 상태를 정확히 반영한 값임.

### P0-4. 정책 상세 API가 실데이터에서 500 — 해결됨

**당초 진단이 틀렸음**

이 항목은 원래 "`PolicyItem`의 `industry`·`target`·`benefit`·`source`가 non-nullable이라 `GET /policies`가 500"이라고 적혀 있었음. 실데이터 Postgres로 검증한 결과 그 지목은 오탐이었음.

| 엔드포인트 | 실제 동작 |
| --- | --- |
| `GET /policies` (목록) | **정상 200.** 2,534건 전부가 `PolicyItem` 검증을 통과함 |
| `GET /policies/{id}` (공고 있음) | **500.** 1,804건(전체의 71%) |
| `GET /policies/{id}` (공고 없음) | 정상 200. 730건 |

`policies`의 `industry`·`target`·`benefit`·`source`는 NULL이 **0건**이었음. NULL이 많은 컬럼은 `region` 2,271건과 `eligibility_rule` 2,178건임. 수집 스크립트가 `None`을 넣을 수 있다는 코드만 보고 데이터를 대조하지 않은 것이 오판의 원인임.

**실제 원인**

`announcements` 1,812건이 **전부** `apply_method`가 NULL임. `policy_service.detail`이 `dict.get("apply_method", "")`로 읽는데, 키가 존재하고 값이 NULL이면 `dict.get`은 기본값이 아니라 `None`을 반환함. `PolicyDetailResponse.applyMethod`가 `str`이라 검증에서 터짐.

시간 순서가 이 상태를 만들었음.

1. `0649d2b`(09-07) Backend가 `apply_method`를 참조하기 시작함. 이때는 `core/store.py`의 인메모리 dict를 읽었고 데모 공고에는 신청 방법이 항상 채워져 있었음
2. `3f0d234` DB 담당이 `DB/app_extras.sql`로 `announcements.apply_method` 컬럼을 신설함(P1-2 참고). 컬럼만 생겼고 수집 스크립트는 채우지 않음
3. `199dbdc`(09-09) Backend가 실제 DB를 직접 조회하도록 전환됨(P1-1 참고)

**왜 그때 발견되지 않았나**

`Backend/core/db.py`의 데모 시드가 `apply_method`에 값을 넣으므로 **SQLite 폴백으로 검증하면 상세 API가 200으로 나옴**. 실데이터 Postgres에서만 500이 남. `b56b85d` 작성자는 목록 API에서 `region` 오류를 만나 고쳤고, 상세 API는 별도 경로라 같은 확인에 걸리지 않았음.

참고로 `region`은 재발이 아님. `Backend/schemas/policies.py`를 건드린 커밋 4개를 전부 확인한 결과 `region`은 최초 커밋 `0649d2b`부터 계속 `str`(필수)였고 `b56b85d`가 처음이자 유일한 수정임. 고쳤다가 되돌아온 적이 없음.

**조치 (2026-09-10)**

- `PolicyDetailResponse.applyMethod`를 `str | None`으로 바꿈. 원천 공고에 신청 방법이 없다는 사실을 그대로 전달함
- `policy_service._apply_period()`를 분리해 없는 쪽 날짜를 표기하지 않게 함. 시작·종료가 모두 NULL인 공고 915건이 `None ~ None`을 렌더하던 문제임
- `PolicyItem`의 `industry`·`target`·`benefit`·`source`를 `str | None`으로 정렬함. **버그 수정이 아니라 예방 조치임.** 네 컬럼 모두 `DB/01_schema.sql`에서 nullable인데 응답 스키마만 필수로 선언돼 있어 둘이 어긋나 있었음

`apply_method`를 실제 값으로 채우는 것은 수집 스크립트 작업이라 하지 않음. DB 담당 협의가 필요함.

**검증**

실데이터 Postgres(정책 2,534건, 공고 1,812건)에서 전 건을 실제 응답 모델에 통과시켜 확인함.

| 대상 | 수정 전 | 수정 후 |
| --- | --- | --- |
| `PolicyItem` × 2,534 | 2,534 통과 | 2,534 통과 (회귀 없음) |
| 상세 × 공고 보유 1,804건 | 0 통과 | **1,804 통과** |
| 상세 × 공고 미보유 730건 | 730 통과 | 730 통과 |
| 공고 요약 | 통과 | 통과 |

`search()`·`eligibility()`·`saved_list()`도 회귀 없음. 렌더 결과는 `applyPeriod`가 `'2026-06-01 ~ 2026-09-30'`, 날짜가 모두 없으면 `''`, `applyMethod`는 `null`임.

데모 5건 SQLite로는 재현되지 않으므로 이 항목의 재검증에는 반드시 실데이터 Postgres를 쓸 것.

### P0-5. 프론트엔드가 Backend를 호출하지 못함 — 미해결

세 겹으로 막혀 있어 프론트엔드가 항상 목데이터로 떨어짐.

1. Vite 프록시에 `rewrite`가 없어 `/api` 접두사가 벗겨지지 않음(`Frontend/vite.config.js:11-16`). Backend에 `/api`로 시작하는 라우트가 없으므로 호출 100%가 404
2. `Authorization` 헤더를 보내지 않고 로그인 흐름 자체가 없음(`Frontend/src/api.js:26-63`). 대상 엔드포인트가 전부 `Depends(get_current_user)`라 401
3. 헬퍼 11개 중 5개가 없는 엔드포인트를 호출함. `/stats`, `/announcements`, `/calendar/upcoming`, `/tax/schedule`, `/tax/documents`. 다섯 개 모두 `Docs/Design/API_SPEC.md`에도 없음

앞의 둘을 고치면 가려져 있던 결함 2건이 드러남. 캘린더 필드명 불일치(`date`/`type`/`note` vs `dueDate`/`eventType`/`description`)로 화면이 빈 채 성공 처리되고, `legalBasis`가 `str`인데 프론트엔드가 `.map()`을 호출해 렌더가 크래시함.

### P0-6. 보안 2건 — 미해결

- `GET /chat/messages/{id}/sources`에 인증이 없음(`Backend/api/chat.py:52-59`). 같은 파일의 다른 라우트 4개는 전부 `Depends(get_current_user)`인데 이것만 빠졌고, 소유자 확인도 없어 누구나 임의 사용자의 RAG 근거 문서를 열람 가능함
- `GET /admin/monitoring`이 `DATABASE_URL`을 자격증명째로 반환함(`Backend/core/postgres.py:12,35,40` → `api/admin.py:161`). `b56b85d`가 `db_path()`에 마스킹을 넣었으나 `postgres_status()`는 손대지 않아 한 값에 두 정책이 공존함

### P1-1. Backend가 실제 DB를 조회하지 않음 — 해결됨

**있었던 문제**

- `Backend/services/`와 `Backend/api/`에 SQL이 한 줄도 없었음. 전부 `Backend/core/store.py`의 모듈 전역 dict를 읽었음
- 결과적으로 수집 스크립트가 넣은 정책 2,534건 대신 `store.py`의 데모 정책 5건이 응답됐음. 챗봇(`/chat/messages`)만 실데이터로 답했는데, LLM이 DB를 직접 읽기 때문이었음

**조치 (`a01a503`, `feature/backend` 병합)**

P0-3(덤프 제거) → P1-2(스키마 마이그레이션) → SQL 전환 순서를 지킴. 스키마를 먼저 맞추면 `TRUNCATE`이 살아나 데이터를 지우므로 이 순서가 필요했음.

- `Backend/core/store.py`(252줄) 삭제. `Backend/core/database.py`는 634줄에서 8줄로 축소
- `Backend/core/db.py`(SQL 실행 계층, 517줄)와 `Backend/core/repo.py`(엔티티 쿼리, 477줄) 신설
- 서비스 8개 전부와 `api/admin.py`·`api/deps.py`를 `repo` 기반으로 재작성. store 참조 총 137곳이 사라짐
- 데모 시드는 "없을 때만 INSERT"로 바뀜(`db.py:413-486`). truncate-and-replace가 아니므로 P0-3 회귀는 아님

**검증**

잔존 `store` 참조 0건, 누락 심볼 0건, 시그니처 불일치 0건, 충돌 마커 0건, 중복 정의 0건. `repo.py`의 함수 58개와 모든 호출부를 대조했고 인자 개수·키워드까지 일치함.

**후속**

전환 자체는 끝났으나, 데모 5건을 전제로 짠 코드가 2,534건 위에서 돌게 되면서 새 결함이 드러남. P0-4·P1-3 참고.

### P1-2. 스키마-코드 컬럼 불일치 — 해결됨

DB 담당이 `3f0d234 Feat: 백엔드 참조 컬럼 및 테이블 추가`로 `DB/app_extras.sql`을 신설해 채움. `notifications` 테이블과 `users.phone`·`status`, `calendar_events.user_id`, `reminders.dispatched`, `expenses.user_id`, `announcements.apply_method`, `announcement_summaries.llm_used`가 생김.

- `meta_ids`는 의도적으로 제외함. 인메모리 id 카운터를 저장하려던 덤프 산출물이라 `SERIAL`을 쓰면 개념이 사라짐. 덤프 경로도 P0-3에서 제거됨
- `calendar_events.user_id`가 들어옴에 따라 `USER` 타입(내 일정 직접 등록)을 정식 수용하기로 결정함. `Docs/Design/ERD.md`·`CLASS.md`·`API_SPEC.md`에 반영함. `notifications`도 같은 방식으로 설계 문서에 편입함
- `docker-compose.yml`의 initdb 마운트에 `02_app_extras.sql`로 추가함. 이미 데이터가 있는 DB에는 initdb가 다시 돌지 않으므로 `psql`로 한 번 직접 적용해야 함. 모든 구문이 `IF NOT EXISTS`라 재실행에 안전함
- 검증: `notifications` 테이블과 새 컬럼 7개 생성 확인. 스키마가 채워진 상태에서 Backend 쓰기를 발생시킨 뒤에도 정책 2,534건·청크 10,523건·세법 4,459건이 그대로임. 예전 코드였다면 이 시점에 `TRUNCATE`이 통과해 데이터가 지워졌을 것임

### P1-3. 전환 이후 드러난 규모·부트스트랩 결함 — 미해결

- **페이지네이션 부재.** `repo.list_policies()`가 LIMIT 없이 전체를 읽고, `GET /calendar`는 매 요청마다 `recommendations()`를 불러 전체 정책 + 전체 공고 + 전체 캘린더 이벤트를 읽음(`services/calendar_service.py:27,32`)
- **`_apply_extras`가 실패를 삼키며 트랜잭션을 오염시킴**(`core/db.py:397-410`). `rollback()`이 없어 한 문장이 실패하면 이후가 전부 조용히 실패하고, 마지막 문장인 `notifications` 생성이 여기 걸림
- **Postgres 경로가 기본 테이블을 만들지 않음**(`core/db.py:488-517`). 스키마 없는 DB에 붙으면 엔진을 postgres로 확정한 뒤 시드에서 예외가 나 서버가 뜨지 않음
- **`.env.example`대로 하면 compose가 기동하지 않음.** `POSTGRES_*`가 빈 값이고 compose에 기본값이 없어 헬스체크가 통과하지 못함
- 전체 33건과 파일·라인은 `Docs/reports/INTEGRATION_ISSUES_0910.md` 참고

### P2-1. Frontend 미병합 — 해결됨

`8dab449 Feat: 창업ON 프론트엔드(React 18 + Vite)`가 PR #19(`72c4b0e`)로 들어옴. `Frontend/`에 Vite + React 앱과 `Dockerfile`이 있고 `LLM/RUN_GUIDE.md` 7절의 안내가 유효해짐.

다만 Backend와 한 번도 맞춰진 적이 없음. 목업 시절의 API 표면을 그대로 호출하므로 현재는 어떤 호출도 성공하지 못함. P0-5 참고.

`docker-compose.yml`에 frontend 서비스가 없는 것은 그대로임.

### P2-2. 기타

- `Backend/Dockerfile:14`가 `uv sync`를 그대로 씀. `Backend/uv.lock`이 커밋됐으므로 `--frozen`을 붙일 수 있음. `LLM/Dockerfile`은 이미 사용 중
- `setup.sh` 0바이트

## 3. 관련 문서

- 통합 결함 목록(33건, 파일·라인 포함): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 작업 체크리스트: `Docs/TODO.md`
- 데이터 구조와 스키마 적용 경로: `Docs/Design/ERD.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md` (구 초안 `LLM_API_SPEC.md`는 기록용 보존)
- Backend 연동 인계 지침: `Docs/Design/BACKEND_LLM_INTEGRATION_HANDOFF.md`
- 시스템 구성: `Docs/Design/ARCHITECTURE.md`
- LLM 서비스 실행 절차: `LLM/RUN_GUIDE.md`
