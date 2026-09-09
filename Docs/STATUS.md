# 진행 현황

- 갱신일: 2026-09-09
- 기준 브랜치/커밋: `develop` / `21c79f9`

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

### P0-1. 서비스 간 통신 미배선

- `docker-compose.yml`의 `backend`에 `ports`·`env_file`·`depends_on` 없음. `llm`에도 `env_file` 없음. 두 컨테이너에 애플리케이션 환경변수가 전혀 주입되지 않음
- `Backend/core/config.py:39` `LLM_API_URL` 기본값이 `http://127.0.0.1:8001`. 컨테이너 안에서는 자기 자신을 가리킴. 설계상 값은 `http://llm:8001` (`Docs/Design/ARCHITECTURE.md` §1)
- `Backend/core/config.py:41` `DATABASE_URL` 기본값도 `127.0.0.1`. Backend는 `.env`를 읽지 않아(`Backend/` 전체에 `load_dotenv` 없음) Postgres 연결 실패 시 SQLite로 내려감
- `LLM/src/core/config.py:10`의 `ROOT_ENV_FILE`이 컨테이너에서 `/.env`로 해석되고, `LLM/.dockerignore:5`가 `.env`를 제외함. LLM 컨테이너는 환경 파일을 하나도 읽지 못함
- 포트 번호 자체는 8001로 일치함. 어긋난 것은 호스트명뿐임

#### 해결 계획

별도 브랜치에서 진행함. 애플리케이션 코드는 건드리지 않고 Compose·Dockerfile·환경변수 예시·설계 문서만 손봄.

**확정 전제**

- DB 정본은 기존 외부 Postgres임. Compose의 `db` 서비스는 `profiles: ["local-db"]`로 감춰 평상시 기동에서 제외하되 정의는 남김. `DB/run_all.sh:9-10`이 `docker exec -i startup_db`를 쓰고 있어 정의를 지우면 수집 파이프라인이 깨짐
- 시크릿은 루트 `.env`로 단일화함. `LLM/src/core/config.py:92`가 이미 루트 `.env`를 읽고 있어 로컬 실행과 Compose가 같은 파일을 봄
- 코드의 `localhost` 기본값은 유지함. 서비스명은 Compose가 주입함. `LLM/RUN_GUIDE.md`의 로컬 실행 절차가 그대로 동작해야 함

**`docker-compose.yml`**

- `backend`에 `ports: "8000:8000"`, `depends_on: [llm]`, `environment` 추가
- `backend`의 `environment`에 `LLM_API_URL: http://llm:8001`, `DATABASE_URL`, `TOKEN_SECRET`, `LLM_TIMEOUT_SECONDS` 지정. `env_file`은 쓰지 않음. Backend에 OpenAI·Cohere 키를 노출할 이유가 없음
- `DATABASE_URL`은 루트 `.env`의 `POSTGRES_*`·`DB_HOST`·`DB_PORT`를 Compose 변수 치환으로 조립함. 비밀번호에 `@ : / #`가 들어 있으면 URL 파싱이 깨지므로, 그 경우 `.env`에 `DATABASE_URL`을 직접 적고 `${DATABASE_URL}`을 씀
- `llm`에 `env_file: .env` 추가. 모델·검색·LangSmith까지 15개 이상을 읽으므로 통째로 넘김. `environment`로는 `DATABASE_URL`과 `VECTOR_STORE_BACKEND`만 덮어씀
- `db`에 `profiles: ["local-db"]` 한 줄 추가. 나머지 내용은 유지

**`Backend/Dockerfile`**

- `ENV UV_PROJECT_ENVIRONMENT=/opt/backend-venv` 추가. 현재 `RUN uv sync`가 만드는 `/app/.venv`를 `./Backend:/app` 바인드 마운트가 가려서 컨테이너 기동 때마다 의존성을 다시 해석함
- `LLM/Dockerfile:9-11`이 같은 문제를 해결해 둔 방식을 그대로 따름
- `Backend/uv.lock`이 없어 `--frozen`은 쓸 수 없음. 락파일 생성은 의존성 변경이라 별도 건임 (P2-2)

**`.env.example`**

- 누락 변수 추가: `TOKEN_SECRET`, `LLM_TIMEOUT_SECONDS`, `LLM_MODEL`, `EMBEDDING_MODEL`, `OPENAI_API_KEY`, `COHERE_API_KEY`, `VECTOR_STORE_BACKEND`
- `LLM_API_URL`은 넣지 않음. Compose가 주입하고 로컬에서는 코드 기본값이 맞음
- `DB_HOST`에 "컨테이너와 호스트 양쪽에서 도달 가능한 주소" 주석 추가

**설계 문서 정정**

- `Docs/Design/ARCHITECTURE.md:27`의 예시 URL `http://llm:8000/...`을 `http://llm:8001/...`로 수정. DB 설명에 외부 인스턴스가 기본이고 `--profile local-db`로 로컬 컨테이너를 띄울 수 있다는 문장 추가
- `Docs/Design/LLM_API_SPEC.md`의 8행 ⚠️ 포트 경고와 75~77행 "코드 반영 필요" 절 삭제. 양쪽 코드가 이미 8001이라 사실이 아님

**합격 기준**

`curl http://localhost:8000/health`가 `llm: "connected"`, `postgres: "connected"`, `pgvector: "ready"`, `llmUrl: "http://llm:8001"`을 반환하면 해결로 봄 (`Backend/main.py:38-52`).

보조 확인:

- `docker compose config`로 치환 결과 확인. 출력에 DB 비밀번호가 그대로 나오므로 화면 공유 중에는 실행 금지
- `docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://llm:8001/health').status)"`가 200. 실패 원인이 DNS인지 설정인지 가르는 용도
- `curl http://localhost:8001/health`의 `llm_configured`·`embedding_configured`가 `true`
- 로컬 회귀: `cd LLM && uv run python main.py`가 8001로 기동, `uv run pytest -q` 통과 개수 유지

`/rag/chat` 응답 품질과 인덱스 준비는 P0-2·P0-3 영역임. 이 작업의 검증은 도달 가능 여부까지만 봄.

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

### P0-3. Backend 쓰기가 벡터 인덱스를 삭제

- `Backend/core/postgres.py:178`의 `TRUNCATE ... RESTART IDENTITY CASCADE` 대상에 `policies` 포함
- `rag_documents.policy_id`가 `policies(id)`를 참조(`DB/01_schema.sql:170`)하므로 CASCADE가 `rag_documents`까지 비움
- 이 경로를 타는 `persist()` 호출이 Backend 전체에 25곳임. 로그인 한 번으로도 LLM이 만든 임베딩과 크롤링 데이터가 함께 사라짐
- 상세는 `Docs/Design/ERD.md`의 RagDocument 모델링 노트 참조

### P1-1. Backend가 실제 DB를 조회하지 않음

- `Backend/services/`와 `Backend/api/`에 SQL이 한 줄도 없음. 전부 `Backend/core/store.py`의 모듈 전역 dict를 읽음
- Postgres와 SQLite는 그 dict의 스냅샷 덤프 용도임
- 결과적으로 수집 스크립트가 넣은 정책 수천 건 대신 `store.py`의 데모 정책 5건이 응답됨

### P1-2. 스키마-코드 컬럼 불일치

- Backend가 참조하지만 `DB/01_schema.sql`에 없는 테이블 2개와 컬럼 7개가 있음
- 목록은 `Docs/Design/ERD.md`의 "스키마에 없는데 Backend가 참조하는 항목" 표 참조. 여기서는 중복 기술하지 않음

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
