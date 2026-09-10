# 진행 현황

- 갱신일: 2026-09-10
- 기준 브랜치/커밋: `feature/integration` / `384b569`

`Docs/TODO.md`가 전체 작업 흐름과 체크리스트라면, 이 문서는 현재 코드 기준의 실제 상태와 미해결 이슈를 정리한 것이다.
해결된 이슈는 3절에 한 줄로만 남긴다. 상세 경위는 커밋과 `Docs/reports/INTEGRATION_ISSUES_0910.md`에 있다.

**남은 것은 P0-6(보안 2건)과 P1-3(규모·부트스트랩) 둘이다.** `Docs/TODO.md`의 "구현 → 서비스 간 연동"은 이 둘이 끝나야 완료로 볼 수 있다.

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

## 2. 미해결 이슈

### P0-6. 보안 2건 — 미해결

- `GET /chat/messages/{id}/sources`에 인증이 없음(`Backend/api/chat.py:52-59`). 같은 파일의 다른 라우트 4개는 전부 `Depends(get_current_user)`인데 이것만 빠졌고, 소유자 확인도 없어 누구나 임의 사용자의 RAG 근거 문서를 열람 가능함
- `GET /admin/monitoring`이 `DATABASE_URL`을 자격증명째로 반환함(`Backend/core/postgres.py:12,35,40` → `api/admin.py:167`). `b56b85d`가 `db_path()`에 마스킹을 넣었으나 `postgres_status()`는 손대지 않아 한 값에 두 정책이 공존함

### P1-3. 전환 이후 드러난 규모·부트스트랩 결함 — 미해결

- **페이지네이션 부재.** `repo.list_policies()`가 LIMIT 없이 전체를 읽고, `GET /calendar`는 매 요청마다 `recommendations()`를 불러 전체 정책 + 전체 공고 + 전체 캘린더 이벤트를 읽음(`services/calendar_service.py:27,32`)
- **`_apply_extras`가 실패를 삼키며 트랜잭션을 오염시킴**(`core/db.py:397-410`). `rollback()`이 없어 한 문장이 실패하면 이후가 전부 조용히 실패하고, 마지막 문장인 `notifications` 생성이 여기 걸림
- **Postgres 경로가 기본 테이블을 만들지 않음**(`core/db.py:488-517`). 스키마 없는 DB에 붙으면 엔진을 postgres로 확정한 뒤 시드에서 예외가 나 서버가 뜨지 않음
- **`.env.example`대로 하면 compose가 기동하지 않음.** `POSTGRES_*`가 빈 값이고 compose에 기본값이 없어 헬스체크가 통과하지 못함
- 전체 33건과 파일·라인은 `Docs/reports/INTEGRATION_ISSUES_0910.md` 참고

### P2-2. 기타

- `Backend/Dockerfile:14`가 `uv sync`를 그대로 씀. `Backend/uv.lock`이 커밋됐으므로 `--frozen`을 붙일 수 있음. `LLM/Dockerfile`은 이미 사용 중
- `setup.sh` 0바이트

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

### 진단이 틀렸던 두 건

P0-4와 P0-5는 조사 끝에 **당초 원인 진단이 틀린 것으로 드러나 재정의했다.** 같은 실수를 반복하지 않도록 남긴다.

- **P0-4** — 목록 API가 500이라고 적었으나 실제로는 정상이었고, 지목한 네 컬럼은 실데이터에서 NULL이 0건이었다. 진짜 원인은 상세 API의 `apply_method`였다
- **P0-5** — 프록시·로그인·경로를 각각 독립된 버그로 적었으나, 셋 다 동반 Backend가 병합에서 빠진 하나의 원인에서 나온 증상이었다

두 경우 모두 **살아 있는 코드만 보고 데이터나 git 이력을 대조하지 않은 것**이 오판의 원인이었다. 결함을 단정하기 전에 실데이터로 재현하거나 해당 파일의 커밋 이력을 확인할 것.

## 4. 관련 문서

- 통합 결함 목록(33건, 파일·라인 포함): `Docs/reports/INTEGRATION_ISSUES_0910.md`
- 작업 체크리스트: `Docs/TODO.md`
- 데이터 구조와 스키마 적용 경로: `Docs/Design/ERD.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md` (구 초안 `LLM_API_SPEC.md`는 기록용 보존)
- Backend 연동 인계 지침: `Docs/Design/BACKEND_LLM_INTEGRATION_HANDOFF.md`
- 시스템 구성: `Docs/Design/ARCHITECTURE.md`
- LLM 서비스 실행 절차: `LLM/RUN_GUIDE.md`
