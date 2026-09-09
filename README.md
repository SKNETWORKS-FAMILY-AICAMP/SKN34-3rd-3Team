# SKN34기 3차 프로젝트 3Team — 창업ON

청년·1인 창업자 맞춤형 AI 행정·재정 지원 플랫폼.
세법·정부지원사업 데이터를 수집해 DB에 적재하고, RAG 기반 근거 제시와 조건 기반 판정을 제공한다.

기획·설계 문서는 [`Docs/`](Docs/README.md) 참고.

## 시스템 구성

```
Frontend (React/Vite :5173)
    │  /api  (vite proxy)
    ▼
Backend (FastAPI :8000) ──내부 REST──▶ LLM 서비스 (FastAPI :8001)
    │                                        │
    └────────────┬───────────────────────────┘
                 ▼
        DB (Postgres + pgvector :5432, Docker)
   policies 2,907 · announcements 2,045 · tax_documents 4,459 · calendar_events 1,143
```

| 폴더 | 역할 | 포트 |
| --- | --- | --- |
| `Frontend/` | 화면 (React 18 + Vite). `src/api.js` 로 `/api/*` 호출, 실패 시 목데이터 폴백 | 5173 |
| `Backend/` | REST API. Controller(`api/`) → Service(`services/`) → Model(`schemas/`) + `core/`(설정·DB풀) | 8000 |
| `LLM/` | RAG 응답 생성. 근거 문서 기반 생성(LangChain) 또는 추출 요약 | 8001 |
| `DB/` | 스키마(`01_schema.sql`) + 공공데이터 수집 스크립트(`scripts/`) | 5432 |

## 전체 실행

### 사전 준비
- Docker Desktop, [uv](https://docs.astral.sh/uv/), Node.js 18+
- 저장소 루트에 `.env` 작성 (`POSTGRES_*`, 공공 API 키)

### 한 번에 실행
```cmd
run_all.bat
```

### 수동 실행
```bash
# 1) DB
docker compose up -d db
docker exec -i startup_db psql -U admin -d startup_platform < DB/01_schema.sql   # 최초 1회
cd DB && run_all.bat && cd ..                                                    # 최초 1회 데이터 수집

# 2) LLM 서비스
cd LLM && uv run uvicorn src.serving.app:app --port 8001

# 3) Backend
cd Backend && uv run uvicorn main:app --reload --port 8000

# 4) Frontend
cd Frontend && npm install && npm run dev
```

| 주소 | 내용 |
| --- | --- |
| http://localhost:5173 | 화면 |
| http://localhost:8000/docs | API 문서 (Swagger) |
| http://localhost:8000/health | Backend·DB 상태 |
| http://localhost:8001/health | LLM 서비스 상태·모드 |

> Backend 가 꺼져 있어도 Frontend 는 목데이터로 동작한다(화면 확인용). 히어로 하단에 `● 실시간 DB 연동 중` / `○ 데모 데이터` 로 표시된다.

## 주요 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/stats` | 홈 지표 (모집 중 공고·정책·세법 조문 수) |
| GET | `/api/announcements?limit=` | 마감 임박 공고 (D-day 순) |
| GET | `/api/policies?keyword&region&industry` | 지원정책 검색 |
| GET | `/api/policies/recommendations?region&industry` | 조건 기반 맞춤 추천 (매칭 점수·이유) |
| GET | `/api/calendar?year&month&type` | 세금 신고일 + 정책 마감일 통합 캘린더 |
| POST | `/api/tax/tax-reduction/check` | 청년창업 세액감면 판정 (Rule Engine + 근거 조문) |
| GET | `/api/tax/documents?q=` | 세법 조문 검색 (RAG Retrieval) |
| POST | `/api/chat/messages` | AI 상담 — DB 근거 검색 후 LLM 서비스로 생성 위임 |

## RAG 동작

1. Backend 가 질문에서 핵심어를 뽑아 `tax_documents` / `policies` 에서 **근거 문서**를 검색한다.
2. 근거를 LLM 서비스로 보내 답변을 생성한다.
   - `ANTHROPIC_API_KEY` 가 있으면 LangChain 으로 생성
   - 없으면 근거에서 관련 문단을 추출해 구성 (환각 없음)
3. Frontend 는 답변 아래에 **근거 문서 목록과 원문 링크**를 함께 표시한다(FS-08).
4. claude.ai 아티팩트 환경에서는 검색된 근거를 컨텍스트로 넣어 생성한다.

## 알려진 제약

- `tax_documents.content` 평균 길이가 **53자** — 수집 스크립트(`DB/scripts/collect_tax_law.py`)가 조문 **제목만** 저장하고 본문을 담지 않았다. 조문 검색은 정확하지만 답변 근거로 쓸 본문이 부족하므로, 수집 로직 보완이 필요하다.
- 인증(회원가입/로그인)은 화면만 있고 백엔드 연동 전이다.
- 지출 분석(영수증 OCR), 관리자 기능은 미구현.

## Git 커밋 규약

`Type: 설명` — Type 은 영문, 설명은 한글.
`Feat` / `Fix` / `Docs` / `Design` / `Refactor` / `Test` / `Chore`
