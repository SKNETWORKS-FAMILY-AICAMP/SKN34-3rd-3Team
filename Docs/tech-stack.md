# 기술 스택
Docker Compose 기반의 컨테이너형 서비스로 구성한다.
각 서비스의 역할 및 통신 구조는 `Docs/Design/ARCHITECTURE.md`를 참고한다.

## Backend
* **Language:** Python 3.13
* **Framework:** FastAPI
* **Architecture:** Controller–Service–Model
* **Directory:** `Backend/api`, `Backend/services`, `Backend/schemas`
* **Communication:** REST API

## LLM
* **Language:** Python 3.13
* **Framework:** LangChain + LangGraph
* **LLM Model:** OpenAI. `LLM/src/models/factory.py`가 `ChatOpenAI`(temperature 0)와 `OpenAIEmbeddings`만 생성하며, 모델명은 `LLM_MODEL`·`EMBEDDING_MODEL` 환경변수로 주입
* **RAG:** LangGraph 그래프로 질문을 policy·notice·tax 경로에 배분. tax는 근거가 충분해질 때까지 검색·재질의를 반복하는 멀티홉(`TAX_MAX_HOPS`, 기본 3)
* **검색:** dense(pgvector) + BM25를 RRF로 융합하는 hybrid가 기본. `RETRIEVAL_MODE`로 dense만 쓰도록 바꿀 수 있음
* **Rerank:** Cohere. 기본 모델 `rerank-v4.0-fast`. 실패하면 RRF 순서로 폴백
* **Guardrail:** 범위 밖 질문 차단, 근거 없는 생성·인용 검증
* **OCR / Vision:** 별도 OCR 엔진이 아니라 OpenAI Vision 호출(`LLM/src/rag/backend_tasks.py`의 `extract_receipt`)
* **Tracing:** LangSmith. 기본 비활성이며 `LANGSMITH_TRACING`으로 켬
* **Dependencies:** `LLM/pyproject.toml` 기준으로 관리

세액감면 **Rule Engine은 LLM이 아니라 Backend에 있다**(`Backend/services/tax_service.py`). LLM은 그 판정 결과에 대한 근거 설명·법령 인용만 생성하며 판정값을 바꾸지 않는다. 역할 경계는 `Docs/Design/LLM_API_SPEC_V1.md` 10절 참고.

## Database
* **RDBMS:** PostgreSQL 16 (`pgvector/pgvector:pg16` 이미지)
* **Vector Store:** pgvector (PostgreSQL extension). `rag_documents.embedding`은 `VECTOR(1536)`이며 HNSW + `vector_cosine_ops` 인덱스를 둠
* 관계형 데이터와 벡터 데이터 통합 관리
* Backend는 Postgres 연결에 실패하면 SQLite(`Backend/data/app.db`)로 폴백해 계속 뜬다. `GET /health`의 `storage`로 어느 쪽인지 확인

## Frontend
* **Framework:** React 18.3 + Vite 5.4
* **Styling:** 단일 `Frontend/src/styles.css`. CSS 변수 기반 라이트·다크 토큰과 반응형. **CSS 프레임워크를 쓰지 않는다**
* **Routing:** 라우터 라이브러리 없음. `App.jsx`의 상태로 뷰를 전환(`home` / `page` / `mypage`)
* **Dependencies:** 런타임 의존성은 `react`·`react-dom` 둘뿐 (`Frontend/package.json`)
* **API 호출:** `Frontend/src/api.js`. 기본 base는 `/api`이고 접두사를 벗겨 Backend로 넘기는 프록시가 앞단에 있음. 개발에서는 Vite(`vite.config.js`), 배포에서는 nginx(`Frontend/nginx.conf`)가 같은 일을 함. 호출 실패 시 목데이터로 폴백

## Infrastructure
* **Container:** Docker
* **Orchestration:** Docker Compose
* **Services:** `backend`(:8000), `llm`(:8001), `db`(:5432), `frontend`(:80) 네 개. **`frontend`는 `frontend` 프로필에 묶인 배포 전용 서비스다** — 로컬 개발에서는 기동하지 않고 호스트에서 Vite 개발 서버(:5173)로 띄운다
* **Network:** Docker 내부 네트워크 기반 서비스 간 통신
* **API Communication:** REST API
* 예: Backend → LLM `http://llm:8001/...`
* **로컬 실행:** `setup.sh`(bash) / `setup.bat`(cmd.exe)이 `.env` 검사부터 빌드·기동·헬스체크·Frontend 실행까지 처리. `.env`는 스크립트가 만들지 않으며 팀에서 받아 루트에 둔다
* **요구 버전:** Docker Compose v2.1.1 이상. 기동 대기를 `compose up --wait`와 `curl --retry`에 맡긴다

## Dependency & Environment Management
* **Python Version:** 3.13
* **Package Manager:** uv
* Python 프로젝트의 의존성 및 가상환경을 `uv`로 관리
* 프로젝트별 `pyproject.toml` 및 `uv.lock`을 통해 의존성 버전을 고정

## Test
* **LLM:** pytest. `LLM/tests/` 아래 테스트 파일 28개. `LLM/pyproject.toml`의 `testpaths = ["tests"]`
* **Backend / Frontend:** 자동 테스트 없음
* **Lint / Formatter:** 설정된 것 없음

## Version Control
* **Git:** 소스 코드 버전 관리
* **GitHub:** 원격 저장소 및 협업 관리
* **Branch Strategy:** `main` / `develop` / `feature/*`

## 관련 문서
* **시스템 구성:** `Docs/Design/ARCHITECTURE.md`
* **데이터 구조:** `Docs/Design/ERD.md`
