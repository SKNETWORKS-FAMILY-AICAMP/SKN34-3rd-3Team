# 진행 현황

- 갱신일: 2026-09-09
- 기준 브랜치: `feature/intergration` (`develop` 병합분 `21c79f9` 기준 + P0-1 배선 작업)

`Docs/TODO.md`가 전체 작업 흐름과 체크리스트라면, 이 문서는 현재 코드 기준의 실제 상태와 미해결 이슈를 정리한 것이다.

## 1. 병합 현황

| 브랜치 | 병합 커밋 | 비고 |
| --- | --- | --- |
| `feature/data-collection` | `7286a9d` (PR #9) | 세법·정책 수집 스크립트 |
| `feature/backend` | `c921867` (PR #10) | Backend API 서버 |
| `feature/LLM-connect-test` | `21c79f9` (PR #11) | LLM RAG(LangGraph) 구현 |
| `feature/Frontend` | 미병합 | `develop`의 `Frontend/`는 `.gitkeep`만 있음 |

병합 자체는 정상임. 충돌 마커 없음. `git diff c921867 HEAD -- Backend`가 비어 있어 Backend 코드 유실 없음.

즉 코드는 다 모였으나 서비스 간 연동이 되어 있지 않은 상태임. 아래 P0 항목이 `Docs/TODO.md`의 "구현 → 서비스 간 연동" 미체크 항목에 해당함.

## 2. 미해결 이슈

### P0-1. 서비스 간 통신 미배선 — 해결됨

- `docker-compose.yml`의 `backend`에 `ports`·`env_file`·`depends_on` 없음. `llm`에도 `env_file` 없음. 두 컨테이너에 애플리케이션 환경변수가 전혀 주입되지 않음
- `Backend/core/config.py:39` `LLM_API_URL` 기본값이 `http://127.0.0.1:8001`. 컨테이너 안에서는 자기 자신을 가리킴. 설계상 값은 `http://llm:8001` (`Docs/Design/ARCHITECTURE.md` §1)
- `Backend/core/config.py:41` `DATABASE_URL` 기본값도 `127.0.0.1`. Backend는 `.env`를 읽지 않아(`Backend/` 전체에 `load_dotenv` 없음) Postgres 연결 실패 시 SQLite로 내려감
- `LLM/src/core/config.py:10`의 `ROOT_ENV_FILE`이 컨테이너에서 `/.env`로 해석되고, `LLM/.dockerignore:5`가 `.env`를 제외함. LLM 컨테이너는 환경 파일을 하나도 읽지 못함
- 포트 번호 자체는 8001로 일치함. 어긋난 것은 호스트명뿐임

#### 해결 계획

`feature/intergration` 브랜치에서 진행함. 애플리케이션 코드는 건드리지 않고 Compose·Dockerfile·환경변수 예시·설계 문서만 손봄.

**확정 전제**

- 검증용 DB는 Compose가 띄우는 `db` 컨테이너를 씀. 작업 당시에는 팀 공용 외부 Postgres에 Backend를 붙이면 P0-3 TRUNCATE가 크롤링 데이터와 임베딩을 지웠으므로 안전한 쪽을 기본값으로 뒀음. 이후 P0-3가 해결돼 그 위험은 사라졌으나, 기본값은 로컬 `db`로 유지함
- 외부 DB 전환은 `COMPOSE_DB_HOST`를 명시할 때만 일어남. 기본값은 `db`
- 시크릿은 루트 `.env`로 단일화함. `LLM/src/core/config.py:92`가 이미 루트 `.env`를 읽고 있어 로컬 실행과 Compose가 같은 파일을 봄
- 코드의 `localhost` 기본값은 유지함. 서비스명은 Compose가 주입함. `LLM/RUN_GUIDE.md`의 로컬 실행 절차가 그대로 동작해야 함

**`docker-compose.yml`**

- `backend`에 `ports: "8000:8000"`, `environment`, `depends_on` 추가
- `backend`의 `environment`에 `LLM_API_URL: http://llm:8001`, `DATABASE_URL`, `TOKEN_SECRET`, `LLM_TIMEOUT_SECONDS` 지정. `env_file`은 쓰지 않음. Backend에 OpenAI·Cohere 키를 노출할 이유가 없음
- `TOKEN_SECRET`에 `:-` 기본값을 둠. 루트 `.env`에 키가 없을 때 빈 문자열이 주입되면 `Backend/core/config.py:29`의 `os.getenv` 기본값이 무시되고 서명 키가 공백이 됨
- `DATABASE_URL`은 `POSTGRES_*`와 `COMPOSE_DB_HOST`·`COMPOSE_DB_PORT`를 Compose 변수 치환으로 조립함. 비밀번호에 `@ : / #`가 들어 있으면 URL 파싱이 깨지므로, 그 경우 `.env`에 `DATABASE_URL`을 직접 적고 `${DATABASE_URL}`을 씀
- `llm`에 `env_file: .env` 추가. 모델·검색·LangSmith까지 15개 이상을 읽으므로 통째로 넘김. `environment`로는 `DATABASE_URL`·`VECTOR_STORE_BACKEND`·`PORT`만 덮어씀
- `db`의 `env_file: .env`를 `environment`의 `POSTGRES_*` 세 개로 좁힘. 루트 `.env`에 OpenAI·Cohere·LangSmith 키가 들어 있어 Postgres 컨테이너가 그것까지 받고 있었음
- `db`에 `pg_isready` 헬스체크 추가. 없으면 Backend가 Postgres 기동 전에 붙으려다 실패하고 `Backend/core/database.py:210-230`이 조용히 SQLite로 내려감. 배선 성공 여부를 구분할 수 없게 됨
- `./DB/01_schema.sql`의 initdb 마운트는 현행 유지. 최초 기동 시 테이블과 `vector` 확장이 자동 생성됨

**`Backend/Dockerfile`**

- `ENV UV_PROJECT_ENVIRONMENT=/opt/backend-venv` 추가. `RUN uv sync`가 만드는 `/app/.venv`를 `./Backend:/app` 바인드 마운트가 가려서 컨테이너 기동 때마다 의존성을 다시 해석함
- `LLM/Dockerfile:9-11`이 같은 문제를 해결해 둔 방식을 그대로 따름
- `Backend/uv.lock`이 없어 `--frozen`은 쓸 수 없음. 락파일 생성은 의존성 변경이라 별도 건임 (P2-2)

**`.env.example`**

- 추가: `COMPOSE_DB_HOST`, `COMPOSE_DB_PORT`, `TOKEN_SECRET`, `LLM_TIMEOUT_SECONDS`, `LLM_MODEL`, `EMBEDDING_MODEL`, `OPENAI_API_KEY`, `COHERE_API_KEY`, `VECTOR_STORE_BACKEND`
- `COMPOSE_DB_HOST`에 P0-3 경고 주석을 붙임
- 기존 `DB_HOST`·`DB_PORT`는 유지. `DB/scripts/*.py` 수집 스크립트가 쓰는 값이라 성격이 다름
- `LLM_API_URL`은 넣지 않음. Compose가 주입하고 로컬에서는 코드 기본값이 맞음

**설계 문서 정정 (완료)**

- `Docs/Design/ARCHITECTURE.md:27`의 예시 URL을 `http://llm:8001/...`로 수정함
- `Docs/Design/LLM_API_SPEC.md`의 8행 ⚠️ 포트 경고와 "코드 반영 필요" 절을 삭제함. 양쪽 코드가 이미 8001이라 사실이 아니었음

**합격 기준**

`curl http://localhost:8000/health`가 `llm: "connected"`, `postgres: "connected"`, `pgvector: "ready"`, `llmUrl: "http://llm:8001"`을 반환하면 해결로 봄 (`Backend/main.py:38-52`).

보조 확인:

- `docker compose exec backend sh -c 'echo "$DATABASE_URL" | sed "s#.*@##"'`가 `db:5432/...`를 출력해야 함. 외부 주소가 나오면 즉시 중단. `@` 앞을 잘라 비밀번호를 가림
- `docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://llm:8001/health').status)"`가 200. 실패 원인이 DNS인지 설정인지 가름
- `docker compose config`로 치환 결과 확인. 출력에 DB 비밀번호가 그대로 나오므로 화면 공유 중에는 실행 금지
- `curl http://localhost:8001/health`의 `llm_configured`·`embedding_configured`. 루트 `.env`에 `OPENAI_API_KEY`가 없으면 `false`가 정상이며 P0-1 판정과 무관함
- 로컬 회귀: `cd LLM && uv run python main.py`가 8001로 기동, `uv run pytest -q` 통과 개수 유지

**남는 위험**

이 작업 시점에는 로컬 빈 DB로 P0-3를 회피할 뿐 고치지 않았음. 이후 P0-3가 해결돼 `COMPOSE_DB_HOST` 전환 시의 데이터 삭제 위험은 사라졌음. 다만 팀 공용 DB를 가리키면 Backend가 그 DB를 읽고 쓰게 되므로 전환은 여전히 신중히 결정할 것.

`/rag/chat` 응답 품질과 인덱스 준비는 P0-2·P0-3 영역임. 로컬 DB에는 크롤링 데이터가 없어 `no_result`가 정상임. 이 작업의 검증은 도달 가능 여부까지만 봄.

**검증 결과 (2026-09-09, `feature/intergration`)**

`docker compose up -d --build` 후 db healthy, backend·llm running. 합격 기준 통과.

```json
{"status":"ok","storage":"sqlite-seeded","postgres":"connected","pgvector":"ready",
 "llm":"connected","ragReady":false,"llmUrl":"http://llm:8001"}
```

- 컨테이너 간 직접 호출 `http://llm:8001/health` → 200
- `curl localhost:8001/health` → `llm: configured`, `embedding: configured`, `data_source: postgres`
- backend가 보는 DB는 `db:5432/startup_platform`. 외부 DB 아님
- `01_schema.sql`이 initdb로 적용돼 테이블 18개와 `vector` 확장 생성됨
- `ragReady: false`는 정상. 로컬 DB에 크롤링 데이터가 없어 인덱스가 비어 있음
- LLM 테스트 182 통과 8 실패. 실패는 전부 `LLM/src/data/RAG_data` 원본 PDF 부재 때문이며 이 작업과 무관함 (`LLM/RUN_GUIDE.md` 8절)

**`storage`가 `sqlite-seeded`인 이유**

당시 Postgres는 연결됐지만 `init_postgres()`가 `None`을 반환했음. `save_postgres()`의 `TRUNCATE`가 존재하지 않는 `notifications`·`meta_ids`를 대상으로 삼아 실패하고 `except Exception`이 이를 삼켰기 때문임. 배선 문제가 아니라 별개 항목이었고, 이 발견이 P0-3 해결의 근거가 됨. 지금은 덤프 자체가 제거돼 `storage`가 항상 `sqlite-*`이며 이는 정상임.

### P0-2. LLM 엔드포인트 7개 미구현

LLM이 실제로 노출하는 경로는 8개임 (`LLM/src/serving/rag_routes.py:135-136`, `LLM/src/serving/app.py:45`).

```
GET  /health
GET  /rag/ready              POST /rag/reindex           POST /rag/chat
GET  /internal/rag/ready     POST /internal/rag/index
POST /internal/rag/answer    POST /internal/rag/recommendations
```

`Backend/core/llm_client.py`가 호출하는 나머지 7개는 전부 404임.

| 호출 경로 | 대체(fallback) 경로 | 영향 기능 |
| --- | --- | --- |
| `/rag/legal-basis` | `/internal/explain/tax-reduction` | FS-13 세액감면 근거 |
| `/ocr/receipt` | `/internal/ocr/receipt` | FS-15 영수증 OCR |
| `/rag/deductibility` | (`/rag/chat`으로 흡수됨) | FS-17 경비처리 가능성 |
| `/rag/summarize-announcement` | `/internal/summarize/announcement` | FS-22 공고문 요약 |

- 주 경로와 대체 경로가 모두 없어 결과가 항상 `None`임
- `Backend/core/llm_client.py:212`가 모든 예외를 `None`으로 삼킴. 로그가 없어 404·타임아웃·503 구분 불가. 겉으로는 "LLM은 붙었는데 답이 목업"으로만 보임
- `Docs/Design/LLM_API_SPEC.md`가 Backend가 코딩한 계약이며, LLM은 그중 `/rag/chat`과 `/rag/reindex`만 구현한 상태임
- `/internal/rag/recommendations`는 구현돼 있으나 Backend가 호출하지 않음. FS-19 맞춤 추천은 `Backend/services/policy_service.py`의 규칙 점수 계산으로만 동작함

**실데이터 검증 결과 (2026-09-09, 로컬 db)**

수집 스크립트로 로컬 DB를 채우고 LLM 인덱스를 만든 뒤 챗봇 경로를 확인함. 스키마는 의도적으로 맞추지 않았고, `users`가 0을 유지해 P0-3 TRUNCATE는 실행되지 않았음.

| 항목 | 값 |
| --- | --- |
| tax_documents / policies / announcements | 4,459 / 2,534 / 1,812 |
| calendar_events (TAX/POLICY) | 10 / 897 |
| rag_documents (embedding ready) | 10,523 청크 / 문서 8,805건 |

- **`/rag/chat` policy 경로는 실데이터로 정상 동작함.** `POST /chat/messages`(category=policy) → `llmUsed: true`, `grounded: true`, `needsConfirmation: false`, 응답 9.6초. `GET /chat/messages/{id}/sources`가 근거 4건 반환하며 k-startup 실제 URL 포함
- **`/rag/chat` tax 경로는 `need_more_info`로 끝남.** "청년창업 세액감면 요건", "부가가치세 신고 기간" 두 질문 모두 사업자 구분·연령·소재지 등을 되물음. 검색이나 인덱스 문제가 아니라 **Backend가 `userContext`를 보내지 않아서임.** `LLM/src/serving/schemas.py:79-87`의 `BackendUserContext`와 `rag_routes.py:465-479`의 매퍼는 이미 구현돼 있고 Backend만 채우면 됨. Tax 브랜치는 근거 없이 답을 만들지 않도록 설계돼 있어(`LLM/LLM작동방식_요약문서.md` 17절) 이 동작 자체는 정상임
- 현재 Backend는 프로필을 질문 문자열 앞에 붙여 개인화를 흉내냄(`Backend/services/chat_service.py:60-64,84`). `userContext` 미전송의 다른 증상임
- 나머지 6개 엔드포인트는 여전히 404이며 이번 검증으로 달라진 것 없음

**재현 시 주의**

- LLM 컨테이너를 재시작하면 메모리의 BM25/Hybrid 검색기가 사라져 `POST /rag/reindex`를 다시 호출해야 함. 두 번째부터는 `source=cache`라 비용 없음
- Backend 기본 타임아웃 25초는 tax 멀티홉에 부족함. 루트 `.env`에 `LLM_TIMEOUT_SECONDS=120`을 두고 검증함. compose 기본값은 25로 유지
- `DB/run_all.bat`을 그대로 쓰지 말 것. 마지막 줄의 `09_add_rag_columns.sql`이 이미 있는 컬럼을 다시 추가하려다 실패함
- `DB/scripts/06_collect_ontong_youth.py`가 7페이지에서 HTTP 400으로 중단됨. 앞 6페이지분은 적재됨. **이 스크립트는 API 키를 URL 쿼리스트링에 넣어 호출하므로 실패 시 예외 메시지에 키가 그대로 로그에 남음.** 별건으로 처리 필요

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

### P1-1. Backend가 실제 DB를 조회하지 않음

- `Backend/services/`와 `Backend/api/`에 SQL이 한 줄도 없음. 전부 `Backend/core/store.py`의 모듈 전역 dict를 읽음
- Postgres와 SQLite는 그 dict의 스냅샷 덤프 용도임
- 결과적으로 수집 스크립트가 넣은 정책 수천 건 대신 `store.py`의 데모 정책 5건이 응답됨
- 실측 대비: 로컬 DB에 정책 2,534건이 있어도 챗봇(`/chat/messages`)만 실데이터로 답하고 `GET /policies`·`/calendar`·`/tax/*`는 데모 5건을 응답함. 챗봇은 LLM이 DB를 직접 읽기 때문임

**진행 순서**

P0-3·P1-2와 한 묶음이며 아래 순서를 지킴. 스키마를 먼저 맞추면 `TRUNCATE`이 살아나 데이터를 지우므로 1단계가 앞에 와야 했음.

1. **덤프 제거** — 완료(P0-3 참고). `TRUNCATE` 소멸
2. **스키마 마이그레이션** — 이제 안전함. 착수 전 결정할 것은 `Docs/Design/ERD.md`의 "스키마에 없는데 Backend가 참조하는 항목" 표 참고. `notifications` 테이블과 `calendar_events.USER` 타입은 설계 문서에 없어 수용 여부를 정해야 하고, `expenses.user_id`는 컬럼 추가와 JOIN 중 선택이며, `meta_ids`는 추가하지 않음
3. **모듈별 SQL 전환** — 참조가 적은 순서로 진행해 단계마다 동작을 확인함

| 모듈 | store 참조 |
| --- | --- |
| `api/deps.py` | 2 |
| `auth_service.py` · `tax_service.py` · `user_service.py` | 각 8 |
| `notify_service.py` | 10 |
| `chat_service.py` | 11 |
| `calendar_service.py` | 17 |
| `expense_service.py` | 21 |
| `policy_service.py` | 22 |
| `api/admin.py` | 38 |

마지막에 `Backend/core/store.py`와 SQLite 경로를 제거하고, 데모 시드는 "없을 때만 INSERT"하는 별도 스크립트로 옮김. 다시 truncate-and-replace로 짜면 P0-3가 되돌아옴.

### P1-2. 스키마-코드 컬럼 불일치

- Backend가 도메인 데이터로 다루지만 `DB/01_schema.sql`에 없는 테이블 2개와 컬럼 6개가 있음. 참조 위치는 `Backend/core/database.py`의 SQLite DDL 기준임
- 덤프 제거(P0-3)로 당장 오류를 내지는 않음. P1-1 3단계에서 SQL 전환을 시작하면 반드시 채워야 함
- 목록과 항목별 판단은 `Docs/Design/ERD.md`의 "스키마에 없는데 Backend가 참조하는 항목" 표 참조. 여기서는 중복 기술하지 않음

### P2-1. Frontend 미병합

- `origin/feature/Frontend`에 Vite + React 앱이 있으나 `develop`에 없음
- `LLM/RUN_GUIDE.md` 7절이 존재하지 않는 `Frontend/`에서 `npm run dev`를 실행하라고 안내함
- `docker-compose.yml`에도 frontend 서비스 없음

### P2-2. 기타

- `Backend/uv.lock` 없음. `Backend/Dockerfile:8`의 `uv sync`가 매 빌드마다 의존성을 재해석함. `LLM/Dockerfile`은 `--frozen`을 사용함
- `setup.sh` 0바이트
- `rag_documents.embedding`에 벡터 인덱스 없음. 저장소 전체에 `ivfflat`·`hnsw`·`vector_cosine_ops`가 없어 유사도 검색이 전건 스캔임
- `LLM/RUN_GUIDE.md:238`이 참조하는 `LANGGRAPH_ARCHITECTURE.md` 없음. 실제 파일명은 `LLM/LLM작동방식_요약문서.md`임

## 3. 관련 문서

- 작업 체크리스트: `Docs/TODO.md`
- 데이터 구조와 스키마 불일치 목록: `Docs/Design/ERD.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC.md`
- 시스템 구성: `Docs/Design/ARCHITECTURE.md`
- LLM 서비스 실행 절차: `LLM/RUN_GUIDE.md`
