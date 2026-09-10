# 진행 현황

- 갱신일: 2026-09-10
- 기준 브랜치/커밋: `feature/integration` / `384b569`

`Docs/TODO.md`가 전체 작업 흐름과 체크리스트라면, 이 문서는 현재 코드 기준의 실제 상태를 정리한 것이다.
해결된 이슈는 3절에 한 줄로만 남긴다. 상세 경위는 커밋과 `Docs/reports/INTEGRATION_ISSUES_0910.md`에 있다.

**미해결 이슈는 없다.** P1-3의 부트스트랩 3건은 재현 조건이 좁아 보류로 두기로 했고(2절), 실행 절차 문서화가 별도 작업으로 남아 있다.

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

병합 자체는 정상이다. 충돌 마커 없음, 코드 유실 없음, 잔존 `store` 참조·누락 심볼·시그니처 불일치 0건이다.

## 2. 보류·잔여 항목

### P1-3. 부트스트랩 결함 3건 — 보류 (재현 조건 한정)

조회량 관련 항목은 해결됐다(3절 참고). 남은 셋은 재현 조건이 좁아 **고치지 않기로 했다.** 다음 사람이 같은 조사를 반복하지 않도록 조건을 남긴다.

| 항목 | 위치 | 재현 조건 |
| --- | --- | --- |
| `_apply_extras`가 실패를 삼키며 트랜잭션을 오염시킴. `rollback()`이 없어 한 문장이 실패하면 psycopg가 트랜잭션을 abort하고 이후가 전부 조용히 실패한다 | `Backend/core/db.py:397-410` | 스키마 없는 Postgres. 모든 문장이 `IF NOT EXISTS`라 기본 테이블이 있으면 실패하지 않는다 |
| Postgres 경로가 기본 테이블을 만들지 않음. 엔진을 postgres로 확정한 뒤 `_seed()`에서 예외가 나 서버가 뜨지 않는다 | `Backend/core/db.py:488-517` | 같음. compose는 initdb로 `01_schema.sql`을 적용한다 |
| `.env.example`의 `POSTGRES_USER`·`PASSWORD`·`DB`가 빈 값이고 compose에 `:-` 기본값이 없다 | `.env.example`, `docker-compose.yml` | fresh clone |

**실행 절차 문서화가 별도로 남아 있다.** 저장소 전체 md 문서 중 `docker compose up`을 언급한 것이 하나도 없고, 루트 `README.md`는 한 줄이며 `setup.sh`는 0바이트다. 신규 팀원은 빈 `.env.example`만 받게 된다. 세 번째 항목은 이 문서화와 함께 다루는 편이 낫다.

### P2-2. 기타

- `setup.sh` 0바이트. 위 실행 절차 문서화와 함께 다룬다

## 3. 해결된 이슈

| 이슈 | 내용 | 조치 |
| --- | --- | --- |
| P0-1. 서비스 간 통신 미배선 | compose에 포트·환경변수·`depends_on`·헬스체크가 없어 컨테이너 간 호출이 안 됨 | PR #13 `8b3f0ef` |
| P0-2. LLM 엔드포인트 미구현 | 세액감면 근거·영수증 OCR·경비 판단·공고 요약 4개 부재 | PR #17 `763f265` |
| P0-2-1. Backend가 LLM V1 계약 미준수 | `/internal/*` fallback 잔존, 엔드포인트별 타임아웃·`userContext`·`noticeResults` 미적용, `sources` 유실 등 9건 | `d8242fc` |
| P0-3. Backend 쓰기가 벡터 인덱스를 삭제 | `save_postgres()`의 `TRUNCATE ... CASCADE`가 `rag_documents`까지 비움. 덤프 경로 자체를 제거 | develop, 2026-09-09 |
| P0-4. 정책 상세 API가 실데이터에서 500 | 공고 1,812건 전부 `apply_method`가 NULL인데 응답 스키마는 필수였음 | `d8242fc` |
| P0-5. 프론트엔드가 Backend를 호출하지 못함 | 동반 Backend(`004ea99`) 유실. 프록시·인증·경로를 현재 계약에 맞추고 `/announcements`·`/stats` 신설 | `384b569` |
| P1-1. Backend가 실제 DB를 조회하지 않음 | `core/store.py`의 전역 dict를 읽어 데모 5건만 응답. `db.py`·`repo.py`로 전환 | `a01a503` |
| P1-2. 스키마-코드 컬럼 불일치 | `DB/app_extras.sql`로 누락 테이블·컬럼 보충 | `3f0d234` |
| P2-1. Frontend 미병합 | 창업ON 프론트엔드 병합 | PR #19 `72c4b0e` |
| AI 상담·공고문 분석 4건. 생성 주체·비로그인 안내·RAG 인덱스·공고문 요약 경로 | claude.ai에서 뷰어의 Claude가 답하고 OpenAI 답변은 버려졌음. 비로그인 401을 "Backend를 실행하라"로 잘못 안내했음. LLM 인덱스가 기동 시 만들어지지 않아 로그인해도 목업이 나왔음 | 아래 참고 |
| P2-2(일부). Backend 이미지 빌드가 락파일을 무시 | `Dockerfile:14`가 `uv sync`를 그대로 써 빌드마다 의존성을 재해석했음. `uv.lock`이 커밋돼 있어 `--frozen`을 붙임 | 아래 참고 |
| P0-6. 보안 2건 | `GET /chat/messages/{id}/sources`에 인증·소유자 확인이 없었고, `/admin/monitoring`이 DB 자격증명을 응답에 실었음 | 아래 참고 |
| P1-3(조회량). 응답 2.5 MB와 무의미한 추천 | `/policies`·`/policies/recommendations`가 2,534건을 전부 반환. 정책 86%가 자격 요건이 비어 있고 나머지도 자유 서술이라 전 건이 `eligible: true`로 표시됐음 | 아래 참고 |
| P0-7. 관리자 토큰이 사용자로 통함 | `users.id`와 `admin_users.id`가 별도 시퀀스라 값이 겹치는데 `get_current_user`가 관리자에게도 같은 모양의 `id`를 줌. 관리자 토큰으로 사용자 프로필·상담 기록이 읽혔음 | 아래 참고 |

### 진단이 틀렸던 두 건

P0-4와 P0-5는 조사 끝에 **당초 원인 진단이 틀린 것으로 드러나 재정의했다.** 같은 실수를 반복하지 않도록 남긴다.

- **P0-4** — 목록 API가 500이라고 적었으나 실제로는 정상이었고, 지목한 네 컬럼은 실데이터에서 NULL이 0건이었다. 진짜 원인은 상세 API의 `apply_method`였다
- **P0-5** — 프록시·로그인·경로를 각각 독립된 버그로 적었으나, 셋 다 동반 Backend가 병합에서 빠진 하나의 원인에서 나온 증상이었다

두 경우 모두 **살아 있는 코드만 보고 데이터나 git 이력을 대조하지 않은 것**이 오판의 원인이었다. 결함을 단정하기 전에 실데이터로 재현하거나 해당 파일의 커밋 이력을 확인할 것.

### P0-6·P0-7 보충

**심각도 정정.** 보고서 결함 5는 "누구나 임의 사용자의 RAG 근거 문서를 열람 가능"이라고 적어 개인 문서가 새는 것처럼 읽혔으나 사실이 아니다. `answer_sources`에는 공개 정책·세법 문서의 제목·URL·발췌만 들어간다. 질문·답변은 보호된 `chat_messages`에 있다. 실제 위험은 id 순회로 상담 주제를 추론하는 수준이었다.

**P0-7은 P0-6 검증 중에 발견했다.** 소유자 검사를 넣고 관리자 토큰으로 시험했더니 404가 아니라 200이 나왔다. 원인은 `admin_users.id`와 `users.id`가 둘 다 1이고 `get_current_user`가 관리자에게도 사용자와 같은 모양의 `id`를 돌려준 것이다. 그 상태에서는 소유자 검사가 전부 무력하다. `deps.py`의 토큰 해석을 나눠 `get_current_user`는 사용자 토큰만, `get_admin`은 관리자 토큰만 받도록 고쳤다. 관리자 토큰으로 사용자 API를 부르면 이제 403이다.

**인증이 없는 라우트 6개는 의도된 공개다.** 다음 감사에서 다시 결함으로 잡히지 않도록 남긴다.

`POST /auth/signup` · `POST /auth/login` · `POST /admin/auth/login`(로그인 경로), `GET /chat/categories/{category}/suggested-questions`(하드코딩 목록), `GET /announcements` · `GET /stats`(공개 정책 정보, P0-5에서 신설).

### P1-3 조회량 보충

**정정 — 문제는 지연이 아니라 응답 크기였다.** 당초 "매 요청마다 전체를 읽어 느리다"고 적었으나 서버 처리는 100 ms 안쪽이었다. 실제 문제는 두 엔드포인트가 2.5 MB를 내려보내는 것이었다. 페이지네이션 후 17 KB가 됐다.

**추천이 전체 목록이었다.** 수집 정책 2,534건 중 2,178건은 `eligibility_rule`이 비어 있고, 값이 있는 356건도 전부 자유 서술이라 규칙 DSL(`age<=39` 등)로 해석되지 않는다. 두 경우 모두 예전 `_match_rule`은 `True`를 돌려줬고, 결과적으로 전 건이 '자격 충족'이 되어 추천이 전체 목록과 같아졌다. 이제 **판정할 수 없으면 `eligible: null`**이고 순위는 `matchScore`로만 매긴다. 요건을 자동 판정하려면 수집 단계에서 규칙을 구조화해야 하며 그건 별개 작업이다.

**캘린더를 추천에서 분리했다.** POLICY 일정은 이제 '저장한 정책 ∪ 마감 전'으로 거른다. 예전에는 추천 목록으로 걸렀는데 추천이 전 건이라 필터가 사실상 없었다. 추천이 상위 20건으로 좁아진 뒤에도 그대로 뒀다면 일정이 897건에서 263건으로 줄었을 것이다. 새 규칙에서는 841건이 남는다.

### Dockerfile `--frozen` 보충

`uv lock --check`로 `Backend/uv.lock`이 `pyproject.toml`과 일치함을 먼저 확인한 뒤 적용했다. 빌드 로그가 `Prepared 22 packages` · `Installed 22 packages`만 찍고 `Resolved` 줄이 사라져, 락파일을 그대로 쓰는 것을 확인했다.

`--no-dev`는 붙이지 않았다. `Backend/pyproject.toml`에 dev 의존성 그룹이 없어 효과가 없다.

`Dockerfile:18`의 `CMD ["uv", "run", ...]`에도 `--frozen`을 붙일 여지가 있다. `LLM/Dockerfile`은 이미 `uv run --frozen`을 쓴다. 바인드 마운트로 `/app/pyproject.toml`이 런타임에 보이므로 컨테이너 기동 때마다 재해석할 수 있다. 이번 범위가 아니라 기록만 남긴다.

### AI 상담 3건 보충

**생성 주체를 설계대로 되돌렸다.** `AiConsult.ask`가 `window.claude`를 먼저 쓰고 LLM 서비스(OpenAI) 답변을 버리고 있었다. 이제 `rag.llmUsed`가 참이면 LLM 서비스 답변을 쓰고, Backend가 실답변을 못 줄 때만 `window.claude`로 내려간다. `llmUsed`를 조건으로 둔 이유는 Backend 목업까지 우선하면 claude.ai 데모가 오히려 나빠지기 때문이다. `window.claude`는 로컬 브라우저에 없어 이 경로는 코드로만 확인했다.

**오류 문구가 원인을 가리키지 않았다.** AI 상담 화면은 로그인 없이 열리는데 `/chat/messages`는 인증이 필요해 401이 났고, 프론트가 예외를 삼켜 "Backend를 실행하라"로 표시했다. `api.js`가 오류에 `status`를 실어 401을 구분하고 로그인 버튼을 띄우도록 고쳤다.

**LLM 인덱스는 기동 시 만들어지지 않았다.** LLM의 `create_app`이 빈 runtime을 만들고 startup 훅이 없어, 누가 재색인을 부르기 전까지 모든 질의가 목업으로 끝났다. Backend `lifespan`에서 데몬 스레드로 워밍업한다. `rag_documents` 10,523행이 임베딩을 이미 갖고 있어 `index_source: "cache"`로 로드되며 OpenAI 재호출은 없다. 워밍업 결과는 `uvicorn.error` 로거로 남는다.

> P0-2-1에서 **질의마다** 하던 준비 확인을 없앤 것과 혼동하면 안 된다. 그건 챗 요청 경로의 왕복이고 이건 기동 시 한 번 도는 워밍업이다.

**공고문 분석기도 같은 방식으로 고쳤다.** `window.claude`만 쓰고 Backend를 아예 부르지 않았다. 원인은 Backend에 붙여넣은 원문을 받는 경로가 없었다는 점이다. `GET /announcements/{id}/summary`는 저장된 공고를 id로만 요약한다. `POST /announcements/summary`를 신설해 LLM의 `/rag/summarize-announcement`로 넘기고, 프론트는 Backend 먼저 · `window.claude` 다음 · 예시 폴백 순으로 내려간다.

LLM 요약 계약에 `method`(신청 방법)가 없어 신청 방법이 `notes`에 섞여 온다. "명시 없음"이라고 단정하면 오해를 부르므로 Backend 결과일 때는 그 칸을 렌더하지 않는다.

**남은 위험.** 프론트 `apiPost` 기본 타임아웃이 30초인데 Backend의 tax 예산은 120초다. 실측 최대 11.7초라 지금은 안 걸린다.

## 4. 관련 문서

- 통합 결함 목록(33건, 파일·라인 포함): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 작업 체크리스트: `Docs/TODO.md`
- 데이터 구조와 스키마 적용 경로: `Docs/Design/ERD.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md` (구 초안 `LLM_API_SPEC.md`는 기록용 보존)
- Backend 연동 인계 지침: `Docs/Design/BACKEND_LLM_INTEGRATION_HANDOFF.md`
- 시스템 구성: `Docs/Design/ARCHITECTURE.md`
- LLM 서비스 실행 절차: `LLM/RUN_GUIDE.md`
