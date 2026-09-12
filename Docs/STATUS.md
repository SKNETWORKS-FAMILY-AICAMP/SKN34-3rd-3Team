# 진행 현황

- 갱신일: 2026-09-11
- 기준 브랜치/커밋: `develop` / `9c8e075`

`Docs/TODO.md`가 전체 작업 흐름과 체크리스트라면, 이 문서는 현재 코드 기준의 실제 상태를 정리한 것이다.
해결된 이슈는 3절에 한 줄로만 남긴다. 상세 경위는 커밋과 `Docs/reports/INTEGRATION_ISSUES_0910.md`에 있다.

**미해결 이슈는 2건이다.** 둘 다 프론트 재설계 병합(`9c8e075`)에서 드러났고 2절에 남긴다. 서명 없는 레거시 토큰은 `c247672`에서 제거됐다. P1-3의 부트스트랩 항목은 재현 조건이 좁아 보류로 두었고, 실행 절차 문서화는 `1781790`의 setup 스크립트로 해소됐다.

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
| `feature/integration` | `abcb308` (PR #20) | 통합 이슈 일괄 해결, LLM OpenAI 연결, setup 스크립트. `develop`으로 병합 |
| `feature/deploy` | `45f9b14` | 프론트 도커화, nginx 프록시, 컨테이너 `restart` 정책. `feat/frontend`가 흡수 |
| `feat/frontend` | `9c8e075` | 프론트 재설계(레이아웃·스타일). 배포 구성까지 함께 `develop`으로 병합 |

병합 자체는 정상이다. 충돌 마커 없음, 코드 유실 없음, 잔존 `store` 참조·누락 심볼·시그니처 불일치 0건이다.

**단 `9c8e075`는 한 번 실패했다가 복구한 뒤 병합했다.** 경위는 3절의 "병합에서 통합 로직이 사라졌던 건"에 있다. 프론트 재설계는 `feature/deploy`를 이미 품고 있었으므로 그 브랜치는 별도 PR 없이 `45f9b14`로 흡수됐다.

## 2. 미해결·보류 항목

### 미해결 1. 공고문 붙여넣기 요약을 부르는 화면이 없다

`POST /announcements/summary`는 Backend·LLM 양쪽 다 살아 있으나 **프론트엔드 호출자가 0건이다.** 프론트 재설계가 `AnnouncementAnalyzer`를 원문 입력 textarea가 있는 화면에서 정적 적합도 카드와 상담 챗으로 바꾸면서, `api.summarizeAnnouncement`를 부르던 UI가 사라졌다.

`Frontend/src/api.js`의 함수와 Backend 엔드포인트는 그대로 두었다. 되살리려면 공고지원 화면에 원문 입력과 결과 표시를 다시 설계해야 하며, 그건 화면 설계 결정이라 코드로 단정하지 않았다. 결함 40 참고.

### 미해결 2. 프론트 `apiPost` 타임아웃이 서버 예산보다 짧다

`Frontend/src/api.js`의 `apiPost` 기본 타임아웃이 30초인데, nginx는 180초(`Frontend/nginx.conf`), Backend의 tax 예산은 120초(`LLM_TIMEOUT_CHAT_TAX`)다. 느린 세무 질문은 서버가 아직 답하는 중에 브라우저가 먼저 끊는다.

실측 최대가 11.7초라 지금은 걸리지 않는다. 재설계 이전부터 있던 문제이며 이번 병합이 만든 것이 아니다.

### P1-3. 부트스트랩 결함 2건 — 보류 (재현 조건 한정)

조회량 관련 항목은 해결됐다(3절 참고). 남은 둘은 재현 조건이 좁아 **고치지 않기로 했다.** 다음 사람이 같은 조사를 반복하지 않도록 조건을 남긴다.

| 항목 | 위치 | 재현 조건 |
| --- | --- | --- |
| `_apply_extras`가 실패를 삼키며 트랜잭션을 오염시킴. `rollback()`이 없어 한 문장이 실패하면 psycopg가 트랜잭션을 abort하고 이후가 전부 조용히 실패한다 | `Backend/core/db.py:397-410` | 스키마 없는 Postgres. 모든 문장이 `IF NOT EXISTS`라 기본 테이블이 있으면 실패하지 않는다 |
| Postgres 경로가 기본 테이블을 만들지 않음. 엔진을 postgres로 확정한 뒤 `_seed()`에서 예외가 나 서버가 뜨지 않는다 | `Backend/core/db.py:488-517` | 같음. compose는 initdb로 `01_schema.sql`을 적용한다 |

세 번째였던 `.env.example` 항목은 **심각도를 낮춰 목록에서 뺐다.** 빈 `POSTGRES_USER`·`PASSWORD`·`DB`로 `docker compose up`을 하면 여전히 무한 대기지만, 정규 실행 경로인 `setup.sh`가 빌드 전에 이 셋의 공백을 먼저 잡아 무엇이 비었는지 알려 주고 멈춘다. compose를 직접 부를 때만 남는 문제다.

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
| 실행 절차 부재 | 저장소 md 문서 어디에도 `docker compose up`이 없고 `setup.sh`는 0바이트였음. 신규 팀원이 빈 `.env.example`만 받았음 | `1781790` |
| P0-7. 관리자 토큰이 사용자로 통함 | `users.id`와 `admin_users.id`가 별도 시퀀스라 값이 겹치는데 `get_current_user`가 관리자에게도 같은 모양의 `id`를 줌. 관리자 토큰으로 사용자 프로필·상담 기록이 읽혔음 | 아래 참고 |
| P0-8. 서명 없는 레거시 토큰이 통함 | `parse_token`이 점 없는 토큰의 HMAC 검증과 만료 검사를 건너뛰어 `Bearer tok_admin_1`만으로 관리자 권한을 얻을 수 있었음 | `c247672` |
| P0-9. Backend 목업이 LLM fallback을 덮어씀 | LLM이 200으로 답해도 `status`가 `error`·`integration_unavailable`이면 그 답변을 버리고 목업 세무 안내를 반환했음. `llmUsed=false` 때문에 프론트가 질문을 다른 모델로 넘겼음 | 보고서 결함 41 |
| P0-10. 병합에서 App.jsx 통합 로직이 통째로 사라졌음 | `a900489`에서 충돌을 파일 단위 ours로 덮어 근거 조문·401 안내·세션 복원·로그아웃·`legalBasis` 렌더가 전부 되돌아갔음. 충돌이 안 난 부분까지 같이 버려졌음 | `e1abe32`, 보고서 결함 42 |

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

**생성 주체를 설계대로 되돌렸다.** `AiConsult.ask`가 `window.claude`를 먼저 쓰고 LLM 서비스(OpenAI) 답변을 버리고 있었다. 이제 LLM 서비스 답변을 먼저 쓰고, Backend가 실답변을 못 줄 때만 `window.claude`로 내려간다. Backend 목업까지 우선하면 claude.ai 데모가 오히려 나빠지므로 조건을 달았다. `window.claude`는 로컬 브라우저에 없어 이 경로는 코드로만 확인했다.

판정 조건은 `fd5fbc2`에서 `rag.llmUsed`에서 `ragUsable`로 바뀌었다. `llmUsed`는 LLM 호출이 성공했다는 뜻일 뿐이어서, 200으로 답했지만 `status`가 `error`·`integration_unavailable`인 경우까지 실답변으로 취급했다. 이제 그 둘을 제외한다. 결함 41 참고.

**오류 문구가 원인을 가리키지 않았다.** AI 상담 화면은 로그인 없이 열리는데 `/chat/messages`는 인증이 필요해 401이 났고, 프론트가 예외를 삼켜 "Backend를 실행하라"로 표시했다. `api.js`가 오류에 `status`를 실어 401을 구분하고 로그인 버튼을 띄우도록 고쳤다.

**LLM 인덱스는 기동 시 만들어지지 않았다.** LLM의 `create_app`이 빈 runtime을 만들고 startup 훅이 없어, 누가 재색인을 부르기 전까지 모든 질의가 목업으로 끝났다. Backend `lifespan`에서 데몬 스레드로 워밍업한다. `rag_documents` 10,523행이 임베딩을 이미 갖고 있어 `index_source: "cache"`로 로드되며 OpenAI 재호출은 없다. 워밍업 결과는 `uvicorn.error` 로거로 남는다.

> P0-2-1에서 **질의마다** 하던 준비 확인을 없앤 것과 혼동하면 안 된다. 그건 챗 요청 경로의 왕복이고 이건 기동 시 한 번 도는 워밍업이다.

**그 워밍업은 콜드 스타트에서 경합에 졌다(2026-09-11 보완).** 전체를 내렸다 한 번에 올리면 `LLM warm-up skipped: /rag/ready unreachable`이 찍히고 `ragReady`가 false로 남았다. 워밍업은 재시도 없이 한 번만 돌고 준비 확인 타임아웃이 3초(`LLM_TIMEOUT_READY`)인데, `docker-compose.yml`의 backend가 llm에 `condition: service_started`로만 걸려 있어 uvicorn이 포트를 열기 전에 확인이 나갔기 때문이다. 이미 떠 있는 LLM 컨테이너에는 재현되지 않아 드러나기 어려웠고, `setup.sh`의 재색인 안내가 그 자리를 메우고 있었다. 인덱스는 LLM 프로세스 메모리에 있어 LLM을 재시작할 때만 사라진다.

llm에 `/health` 헬스체크를 붙이고 backend의 의존을 `service_healthy`로 바꿔 해결했다. db가 이미 쓰던 패턴이라 애플리케이션 코드는 건드리지 않았다. 이미지에 curl이 없어 헬스체크는 python으로 확인한다. 배포에서는 서버 재부팅이 곧 콜드 스타트라 이 보완이 없으면 상시 문제가 된다.

**공고문 분석기도 같은 방식으로 고쳤다.** `window.claude`만 쓰고 Backend를 아예 부르지 않았다. 원인은 Backend에 붙여넣은 원문을 받는 경로가 없었다는 점이다. `GET /announcements/{id}/summary`는 저장된 공고를 id로만 요약한다. `POST /announcements/summary`를 신설해 LLM의 `/rag/summarize-announcement`로 넘기고, 프론트는 Backend 먼저 · `window.claude` 다음 · 예시 폴백 순으로 내려가게 했다.

LLM 요약 계약에 `method`(신청 방법)가 없어 신청 방법이 `notes`에 섞여 온다. "명시 없음"이라고 단정하면 오해를 부르므로 Backend 결과일 때는 그 칸을 렌더하지 않았다.

> **이 프론트 쪽 조치는 `9c8e075`에서 되돌아갔다.** 재설계가 원문 입력 화면 자체를 교체해 호출자가 없어졌다. Backend·LLM 경로는 그대로 살아 있다. 2절 미해결 1 참고.

**남은 위험.** 2절 미해결 2로 옮겼다. nginx가 앞단에 붙으면서 타임아웃 층이 하나 더 늘었다.

### 병합에서 통합 로직이 사라졌던 건

프론트 재설계 브랜치가 `develop`을 받아들인 `a900489`에서 `Frontend/src/App.jsx` 충돌을 **파일 단위로 자기 쪽을 택해** 해결했다. 그 결과 `384b569`·`c4eb000`의 App.jsx 변경분 156줄이 통째로 사라졌다.

**피해가 충돌 범위보다 컸다.** 당시 충돌 블록은 10개(약 450줄)였는데 병합 결과가 상대 커밋과 바이트 단위로 동일했다. `-X ours`도 `-s ours`도 아니다 — 같은 병합에서 Backend 24개 파일은 정상 반영됐다. develop 쪽 변경 14곳 중 6곳은 애초에 충돌도 안 났고 git이 이미 자동 병합해 둔 것인데, 파일 단위 덮어쓰기가 그것까지 버렸다. 충돌 마커로 보인 적이 없으니 사라지는 것을 아무도 인지하지 못했다.

되돌아간 항목은 전부 결함 목록에 해결로 기록돼 있던 것들이다. 근거 조문 조회(23), 생성 주체 우선순위(37), 비로그인 401 안내(38), 공고문 요약 호출(40), `legalBasis` 타입(8), 세션 복원과 로그아웃. `e1abe32`에서 `9c8e075` 병합 전에 되살렸고, 공고문 요약만 화면이 사라져 2절로 넘겼다.

`legalBasis`는 특히 위험했다. 문자열을 배열로 다뤄 `.map()`에서 화면이 죽는데, 인증 경로가 고장 나 서버 응답이 계속 비어 있어 가려져 있었다. 401 안내를 고치는 순간 드러날 크래시였다.

**같은 사고를 막는 방법.** 충돌이 크면 파일 단위로 넘기지 말고 base를 함께 띄운다.

```bash
git checkout --conflict=diff3 Frontend/src/App.jsx
```

2단 표시로는 450줄이 전부 낯설어 보이지만, base를 끼우면 레이아웃 변경과 통합 로직 추가가 서로 다른 줄임이 드러난다. 병합 직후에는 두 번째 부모와 대조한다. 이 한 줄이면 이번 사고는 즉시 잡혔다.

```bash
git diff HEAD^2 HEAD -- Frontend/src/App.jsx
```

`a900489`에 돌리면 634줄 삭제로 나오고 그 안에 `api.chatSources`·`api.me()`·`api.logout()`이 전부 `-`로 찍힌다. App.jsx에는 테스트도 타입 체크도 없고, 병합 커밋을 첫 부모와 비교하면 "레이아웃 변경"으로만 보여 리뷰에서도 걸리지 않는다.

### 실행 절차 보충

`setup.sh` / `setup.bat`(cmd.exe용)이 로컬 기동을 처리한다. 본론에 앞서 `.env`를 검사한다. 파일이 없거나 `POSTGRES_USER`·`POSTGRES_PASSWORD`·`POSTGRES_DB` 중 하나라도 비어 있으면 그 자리에서 멈추고 무엇이 비었는지 알려 준다. `OPENAI_API_KEY`가 없으면 "AI 답변이 목업이 된다"고 경고만 하고 계속한다.

1. `compose build`
2. `db` 기동 후 `DB/app_extras.sql`을 `psql`로 다시 적용 — initdb는 볼륨이 비어 있을 때만 돌기 때문이다. 전 문장이 `IF NOT EXISTS`라 재실행에 안전하고 기존 행을 지우지 않는다
3. `backend`·`llm` 기동
4. 헬스체크. `/health`의 `storage`가 `postgres`인지, `ragReady`가 참인지 확인해 각각 폴백·목업 상태를 경고. 응답이 없으면 해당 컨테이너 로그 30줄을 찍고 멈춘다

이후 `Frontend`에서 필요할 때만 `npm ci`를 돌리고 Vite 개발 서버를 실행한다. `--no-frontend`를 주면 4단계까지만 하고 끝난다.

**스크립트는 `.env`를 만들지 않는다.** 비밀키가 들어 있어 git으로 공유되지 않으므로 팀에서 파일로 받아 저장소 루트에 두어야 한다.

기동 대기는 직접 구현하지 않고 `docker compose up --wait`와 `curl --retry`에 맡긴다. 그래서 **Docker Compose v2.1.1 이상**이 필요하다. `setup.bat`의 메시지는 전부 ASCII 영문이다. cmd.exe가 배치 파일을 OEM 코드페이지로 읽어 비ASCII 문자가 출력과 파싱을 함께 깨뜨리기 때문이다.

### 지역명 정규화 제약을 기존 DB에 적용하는 절차 (PR #27 후속)

`users.region`의 `chk_users_region` 제약은 `DB/app_extras.sql`에만 정의돼 있고, 이 파일은 빈 볼륨으로 컨테이너를 처음 띄울 때만 자동 실행된다. 이미 `db_data` 볼륨이 있는 DB에는 적용되지 않으므로 직접 실행해야 한다. 제약 추가 구문은 `pg_constraint` 확인으로 감싸 두었으니 몇 번 다시 돌려도 안전하다.

1. 기존 값 확인. `SELECT region, COUNT(*) FROM users GROUP BY region;` 로 17개 시·도 밖의 값을 찾는다
2. 해당 값을 짧은 이름으로 고치거나 NULL로 비운다
3. `docker exec -i startup_db psql -U <user> -d <db> < DB/app_extras.sql` 실행
4. 기존 행까지 검사하려면 `ALTER TABLE users VALIDATE CONSTRAINT chk_users_region;` 을 덧붙인다. 제약은 `NOT VALID`로 추가되므로 이 단계 전에는 신규 INSERT·UPDATE만 검사된다

## 4. 관련 문서

- 통합 결함 목록(33건, 파일·라인 포함): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 작업 체크리스트: `Docs/TODO.md`
- 데이터 구조와 스키마 적용 경로: `Docs/Design/ERD.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md` (구 초안 `LLM_API_SPEC.md`는 기록용 보존)
- Backend 연동 인계 지침: `Docs/Design/BACKEND_LLM_INTEGRATION_HANDOFF.md`
- 시스템 구성: `Docs/Design/ARCHITECTURE.md`
- LLM 서비스 실행 절차: `LLM/RUN_GUIDE.md`
- 전체 로컬 실행: `setup.sh` · `setup.bat` (각 파일 상단 주석)
