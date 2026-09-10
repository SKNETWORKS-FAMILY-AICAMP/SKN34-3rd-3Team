# feature/integration 통합 결함 목록

- 작성일: 2026-09-10
- 기준 브랜치/커밋: `feature/integration` / `b56b85d`
- 범위: 코드 미수정. 조사 결과 기록만 함

## 0. 요약

`feature/integration`은 `1bfb990`(프론트엔드 병합 + 문서) 위에 `origin/feature/backend`를 병합(`a01a503`)하고 통합 이슈 수정 커밋(`b56b85d`) 하나를 얹은 상태임. 이 병합이 Backend 데이터 계층을 통째로 교체함.

| 항목 | 내용 |
| --- | --- |
| 삭제 | `Backend/core/store.py` (모듈 전역 dict 저장소, 252줄) |
| 축소 | `Backend/core/database.py` 634줄 → 8줄 |
| 신설 | `Backend/core/db.py`(SQL 실행 계층, 517줄), `Backend/core/repo.py`(엔티티 쿼리, 477줄) |
| 재작성 | 서비스 8개 전부 + `api/admin.py` + `api/deps.py` |

`Docs/STATUS.md`의 P1-1(Backend가 실제 DB를 조회하지 않음)을 해소한 변경임.

**병합의 기계적 부분은 깨끗함.** 잔존 `store` 참조 0건, 누락 심볼 0건, 시그니처 불일치 0건, 충돌 마커 0건, 중복 정의 0건임. 문제는 세 갈래에서 발생함.

1. 데모 정책 5건을 전제로 짠 코드가 수집 스크립트가 채운 정책 2,534건 위에서 돌게 됨
2. 같은 브랜치에 처음 들어온 프론트엔드가 Backend와 한 번도 맞춰진 적이 없음. 목업 시절의 API 표면(`/stats`, `/announcements`, `dday`, `sourceUrl`, `rate`, 이벤트의 `date`·`type`·`note`)을 그대로 호출함
3. `Docs/STATUS.md` P0-2-1(Backend가 LLM V1 계약을 준수하지 않음)이 이 브랜치에서 하나도 해소되지 않음

결함 총 33건. 심각도별 분포는 P0 6건, P1 9건, P2 8건, P3 10건임.

2026-09-10 기준 해결 6건. 결함 16~20(P0-2-1 대응)과 결함 10(P0-4 대응)임.
결함 4는 검증 결과 **오탐**으로 판명돼 정정했음. 나머지 26건은 미해결임.

---

## 1. P0 — 데모가 동작하지 않음

### 1. Vite 프록시가 `/api` 접두사를 벗기지 않음

- 위치: `Frontend/vite.config.js:11-16`
- 증상: 프론트엔드에서 Backend로 가는 호출 100%가 404임
- 원인: `changeOrigin: true`는 `Host` 헤더만 바꿈. `rewrite`가 없어 `/api/policies`가 Backend에 `/api/policies`로 도착하는데, Backend에 `/api`로 시작하는 라우트가 하나도 없음. 같은 파일 11행 주석은 "`/api/*` → `http://localhost:8000/*`"라고 적혀 있으나 실제 동작이 다름
- 참고: `Frontend/src/api.js:14`가 `BASE`를 `VITE_API_BASE_URL || '/api'`로 잡으므로 모든 경로가 이 접두사를 탐

### 2. 프론트엔드가 인증 토큰을 보내지 않음

- 위치: `Frontend/src/api.js:26-63`, `Backend/api/deps.py:13-14`
- 증상: 결함 1을 고쳐도 `/policies*`·`/calendar`·`/chat/messages`·`/tax/*`가 전부 401임
- 원인: `apiGet`은 `Accept`만, `apiPost`는 `Content-Type`·`Accept`만 보냄. `Authorization` 헤더가 없음. 토큰 저장소도, 로그인 호출도 프론트엔드에 존재하지 않음. 반면 위 엔드포인트는 전부 `Depends(get_current_user)`이고, 자격증명이 없으면 401을 던짐

### 3. 프론트엔드가 없는 엔드포인트 5개를 호출함

- 위치: `Frontend/src/api.js:67-75`
- 증상: 헬퍼 11개 중 5개가 404임

| 프론트엔드 호출 | Backend 실제 |
| --- | --- |
| `GET /stats` | 없음. `/health`가 유사한 역할 |
| `GET /announcements?limit=N` | 없음. `GET /announcements/{id}/summary`만 있고 목록은 `/admin/announcements`(관리자 전용) |
| `GET /calendar/upcoming` | 없음. `/calendar/{event_id}`는 DELETE 전용이고 `upcoming`은 정수도 아님 |
| `GET /tax/schedule` | `GET /tax/calendar` |
| `GET /tax/documents` | `GET /admin/tax-documents`(관리자 전용) |

- 원인: 다섯 경로 모두 `Docs/Design/API_SPEC.md`에도 없음. 설계 문서의 계약이 아니라 프론트엔드 목업 시절의 산물임

### 4. 정책 응답 스키마가 NULL을 허용하지 않아 실데이터에서 500 — **오탐(2026-09-10 정정)**

> **이 항목은 틀렸음.** 실데이터 2,534건을 실제 `PolicyItem`에 통과시킨 결과 **2,534건 전부 검증을 통과**했고
> `GET /policies`는 500이 아니라 200임. `industry`·`target`·`benefit`·`source`는 NULL이 **0건**임.
>
> | 컬럼 | NULL 건수 |
> | --- | ---: |
> | `region` | 2,271 |
> | `industry`·`target`·`benefit`·`source` | 0 |
> | `eligibility_rule` | 2,178 |
>
> 수집 스크립트가 `None`을 넣을 수 **있다**는 코드만 보고 데이터를 대조하지 않은 채 단정한 것이 원인임.
> `b56b85d`의 `region` 수정은 실데이터 기준으로 옳고 충분했으며 "미완 수정"이 아니었음.
> 실제 500은 결함 10(`applyMethod`)이었고 그쪽을 P1로 낮게 분류한 것이 두 번째 오판임.
>
> 조치: 스키마와 DB의 nullability를 맞추기 위해 네 필드를 `str | None`으로 정렬함(예방 조치이며 버그 수정이 아님).
> 경위는 `Docs/STATUS.md` P0-4 참고.

아래는 정정 전 기술이며 기록용으로 남김.

- 위치: `Backend/schemas/policies.py:11-14`, `Backend/services/policy_service.py:23-34`
- 증상: `GET /policies`, `/policies/recommendations`, `/policies/saved`, `/policies/{id}`가 전부 500임. 한 행만 NULL이어도 목록 전체가 죽음
- 원인: `PolicyItem.industry`·`target`·`benefit`·`source`가 non-nullable `str`인데 `DB/01_schema.sql:58-69`의 해당 컬럼은 전부 nullable임. 수집 스크립트가 명시적으로 `None`을 넣음

```python
# DB/scripts/05_collect_bizinfo.py:112-117
"region": None,   # hashtags에 지역명이 섞여있지만 정확한 파싱 근거 불충분, 일단 비워둠
"industry": item.get("pldirSportRealmLclasCodeNm", None),
"target": item.get("trgetNm", None),
"eligibility_rule": None,
```

- `04_collect_kstartup.py:95-100`, `06_collect_ontong_youth.py:128-132`도 같은 방식임
- 비고: `b56b85d`가 `region`만 `str | None`으로 고치고 형제 4개를 남긴 미완 수정임. 같은 커밋이 붙인 주석("원천 공고에 지역 정보가 없으면 null")이 이 상황을 정확히 설명하고 있음

---

## 2. P0 — 보안

### 5. `GET /chat/messages/{id}/sources`에 인증이 없음

- 위치: `Backend/api/chat.py:52-59`, `Backend/services/chat_service.py:117-120`
- 증상: 인증하지 않은 누구나 임의 사용자의 RAG 근거 문서를 열람 가능함
- 원인: 같은 파일의 다른 라우트 4개는 전부 `Depends(get_current_user)`인데 이 하나만 빠짐. 서비스 계층도 메시지 존재 여부만 확인하고 소유자를 확인하지 않음

```python
# Backend/api/chat.py:57-59
def sources(message_id: int = Path(description="메시지 ID")):
    """해당 답변에 저장된 RAG 또는 샘플 근거 문서를 반환합니다."""
    return {"sources": chat_service.get_sources(message_id)}
```

### 6. `GET /admin/monitoring`이 DB 비밀번호를 평문으로 반환함

- 위치: `Backend/core/postgres.py:12,35,40`, `Backend/api/admin.py:161`
- 증상: 응답 본문에 `DATABASE_URL`이 자격증명을 포함한 채로 실림
- 원인: `b56b85d`가 `db_path()`에 `_masked_database_url()`을 추가했으나 `postgres_status()`는 손대지 않음. 세 반환 경로가 전부 `DATABASE_URL` 원문을 실어 보내고, `admin.py`가 그 dict를 통째로 응답에 넣음. 한 값에 대해 두 모듈이 상반된 정책을 가짐
- 비고: 관리자 인증 뒤에 있으나, 자격증명이 응답 본문과 로그·브라우저 히스토리에 남는 것 자체가 문제임

---

## 3. P1 — 실데이터·실환경에서 깨짐

### 7. 캘린더 필드명이 전부 어긋나 화면이 영구히 빈 채로 성공 처리됨

- 위치: `Frontend/src/App.jsx:2194-2205`, `Backend/schemas/calendar.py:6-14`
- 증상: Backend 호출이 성공해도 캘린더가 빈 화면이고, 심지어 목데이터 폴백조차 버려짐
- 원인: 프론트엔드가 `e.date`·`e.type`·`e.note`를 읽는데 `CalendarEvent`는 `dueDate`·`eventType`·`description`을 보냄. `if (!e.date) return`에서 전량 탈락해 빈 객체가 됨. 그런데 `Frontend/src/api.js:109`의 empty 판정이 배열에만 적용되므로 빈 객체는 empty로 잡히지 않음. 결과적으로 `source: 'api'`로 보고하면서 fallback을 폐기함
- 추가: `eventType`은 `TAX`·`POLICY`·`USER` 대문자인데 프론트엔드 비교는 소문자임

### 8. `legalBasis` 타입 불일치로 React 렌더 크래시

- 위치: `Frontend/src/App.jsx:1423-1433`, `Backend/schemas/tax.py:29`
- 증상: 세액감면 판정 결과를 받으면 화면이 통째로 죽음
- 원인: `TaxReductionResponse.legalBasis`는 `str`인데(`tax_service.py:97-101`이 단일 문자열을 넣음) 프론트엔드가 배열로 다룸. 문자열의 길이 검사는 통과하므로 분기에 진입한 뒤 `.map()` 호출에서 TypeError가 남
- 추가: 같은 블록의 `srv.rate`는 스키마에 존재하지 않아 값이 비어 렌더됨
- 비고: 결함 1·2 때문에 서버 응답이 계속 `null`로 남아 현재는 가려져 있음. 앞의 둘을 고치는 순간 드러남

### 9. 영수증 추출 응답의 필수/선택이 LLM과 반대

- 위치: `Backend/schemas/expenses.py:15-21`, `Backend/services/expense_service.py:80-87`
- 증상: 추출 행이 없는 영수증에 대해 `GET /expenses/receipts/{id}`가 404가 아니라 500임
- 원인: 서비스가 추출 행이 없으면 빈 dict로 대체한 뒤 `.get()`으로 `None`을 반환하는데 `date`·`vendor`·`amount`가 required임. LLM 쪽 동명 모델(`LLM/src/serving/schemas.py:178-181`)은 세 필드가 전부 optional이라 같은 이름의 계약이 정반대임

### 10. `policy_service.detail`이 NULL을 그대로 흘려 500 — **실제 원인. 해결됨(2026-09-10)**

> 결함 4가 아니라 이 항목이 실데이터 500의 진짜 원인이었음. 공고 1,812건이 **전부** `apply_method`가 NULL이라
> 공고를 가진 정책 1,804건(전체의 71%)의 상세 조회가 죽었음. 시험한 400건이 100% 실패했음.
> `apply_start_date`·`apply_end_date`가 함께 NULL인 공고 915건은 `applyPeriod`에 `None ~ None`을 렌더했음.
>
> 조치: `applyMethod`를 `str | None`으로 바꿔 값이 없으면 `null`을 반환하고, `applyPeriod`는 없는 쪽 날짜를
> 표기하지 않도록 `_apply_period()`로 분리함. 수정 후 공고 보유 정책 1,804건과 미보유 730건이 전부 통과함.

- 위치: `Backend/services/policy_service.py:153-154`
- 증상: `GET /policies/{id}`가 500이거나 `applyPeriod`에 `None ~ None`이 렌더됨
- 원인: `dict.get(key, default)`는 키가 존재하고 값이 NULL이면 기본값이 아니라 `None`을 반환함. `announcements.apply_method`는 `DB/app_extras.sql:10`이 나중에 추가한 컬럼이라 수집분이 전부 NULL이고, `PolicyDetailResponse.applyMethod`는 `str`임

```python
period = f"{announcement['apply_start_date']} ~ {announcement['apply_end_date']}"
method = announcement.get("apply_method", "")
```

### 11. 페이지네이션 부재로 매 요청이 전체 테이블을 스캔함

- 위치: `Backend/core/repo.py:339-340`, `Backend/services/policy_service.py:53,137`, `Backend/services/calendar_service.py:27,32`
- 증상: `GET /policies`가 정책 2,534건을 전부 응답에 담음. `GET /calendar`는 그보다 무거움
- 원인: 데모 5건 전제의 코드가 그대로 남음
  - `repo.list_policies()`가 전체 행을 읽고 LIMIT이 없음
  - `search()`·`recommendations()`가 전 건을 파이썬에서 필터·점수화함. `api/policies.py:16`에 페이지 파라미터도 없음
  - `calendar_service.list_events()`가 **매 요청마다** `recommendations(user_id)`를 호출해 전체 정책 + 전체 공고 + 전체 캘린더 이벤트를 읽음. `DB/scripts/08_link_policy_calendar.sql`이 마감일 있는 공고마다 이벤트를 만들므로 이벤트도 수천 건임
  - `policy_service.saved_list()`(`:179-186`)는 캐시 없이 `_to_item_for_user`를 호출해 저장 정책 1건당 커넥션 3개를 씀
  - `GET /admin/policies`·`GET /admin/announcements`는 response_model도 페이지네이션도 없이 전체 행을 반환함

### 12. `_apply_extras`가 실패를 삼키면서 트랜잭션을 오염시킴

- 위치: `Backend/core/db.py:397-410`
- 증상: `notifications` 테이블이 만들어지지 않은 채로 Postgres가 정상 준비된 것처럼 보고됨. 로그도 남지 않음
- 원인: 문장별로 예외를 잡고 `continue`하는데 `rollback()`이 없음. psycopg는 문장 하나가 실패하면 트랜잭션 전체가 abort 상태가 되므로 **이후 문장이 전부 조용히 실패**함. `app_extras.sql`의 마지막 문장이 `notifications` 테이블 생성이라 여기 걸림. 그 뒤 `db.py:499`의 커밋이 abort된 트랜잭션에 대해 호출됨
- 영향 범위: `app_extras.sql`은 `users.phone`·`status`, `calendar_events.user_id`, `reminders.dispatched`, `expenses.user_id`, `announcements.apply_method`, `announcement_summaries.llm_used`를 공급함. `repo.py`가 이 여섯 컬럼에 의존하므로 이 파일이 사실상 단일 실패점임

### 13. Postgres 경로가 기본 테이블을 만들지 않음

- 위치: `Backend/core/db.py:488-517`
- 증상: 스키마가 없는 Postgres에 붙으면 서버가 뜨지 않고, 오류 메시지가 원인을 가리키지 않음
- 원인: `init_db()`의 Postgres 분기가 `_apply_extras()`만 적용하고 바로 `_seed()`로 감. `DB/01_schema.sql`은 Docker initdb 마운트로만 적용되므로, 연결에 성공하면 엔진을 postgres로 확정한 뒤 `_seed()`의 첫 쿼리가 예외를 던져 lifespan이 실패함. SQLite 분기는 `SQLITE_DDL`로 자체 부트스트랩하므로 두 엔진이 비대칭임

### 14. `.env.example`대로 하면 compose가 기동하지 않음

- 위치: `.env.example:4-6`, `docker-compose.yml:8,42-52`
- 증상: `db` 컨테이너가 기동을 거부하고 `backend`·`llm`이 `depends_on: service_healthy`에서 영구 대기함
- 원인: `POSTGRES_USER`·`POSTGRES_PASSWORD`·`POSTGRES_DB`가 빈 값이고 compose에도 기본값이 없음. 그대로 복사하면 접속 문자열에 사용자·DB명이 비고, `pg_isready` 헬스체크가 통과하지 못함
- 추가 누락: `TOKEN_SECRET`, `COMPOSE_DB_HOST`, `COMPOSE_DB_PORT`, `VITE_API_BASE_URL`. `.env.example`이 DB 수집·LLM 위주라 Backend와 compose의 설정 표면이 반영되지 않음

### 15. `_seed()`가 공용 Postgres에 데모 데이터를 씀

- 위치: `Backend/core/db.py:413-486`
- 증상: 팀 공용 DB에 데모 계정과 데모 TAX 일정 5건이 섞임
- 원인: 정책은 건수가 0보다 크면 건너뛰지만(`db.py:454`) 사용자·관리자·TAX 캘린더는 조건이 달라 실데이터 DB에서도 삽입이 일어남
- 비고: `Docs/STATUS.md` P0-3이 지운 것은 `TRUNCATE`이며 시드 쓰기는 남아 있음. 데이터 삭제는 아니므로 P0-3 회귀는 아님

---

## 4. P2 — Backend↔LLM 계약

LLM 쪽 V1 엔드포인트(`/rag/ready`, `/rag/reindex`, `/rag/chat`, `/rag/legal-basis`, `/rag/deductibility`, `/rag/summarize-announcement`, `/ocr/receipt`)는 전부 구현되어 있고 경로·메서드·필드명이 맞음. 어긋난 것은 Backend가 계약의 일부만 쓴다는 점이었음.

> **2026-09-10 해결.** 이 절의 결함 16~20을 전부 수정함. 조치와 검증은 `Docs/STATUS.md` P0-2-1에 기록함.
> 아래 기술은 수정 전 상태이며 기록용으로 남김.

### 16. `/internal/*` fallback 중 3개는 LLM에 존재하지 않음 — 해결됨(2026-09-10)

- 위치: `Backend/core/llm_client.py:82-91,138-141,155-158`
- 증상: LLM이 한 번 실패할 때마다 확정 404에 왕복을 한 번 더 씀
- 원인: LLM에 등록된 internal 접두사는 `/internal/rag` 하나뿐임(`LLM/src/serving/rag_routes.py:152`). OCR은 `/ocr`에 있고 `/internal/summarize`·`/internal/explain` 라우터는 아예 없음. 따라서 `/internal/ocr/receipt`, `/internal/summarize/announcement`, `/internal/explain/tax-reduction` 세 경로는 병합 전 잔재임
- 비고: V1 §1이 "Backend는 이를 호출하거나 fallback 경로로 사용하지 않는다"고 못박은 대상임

### 17. `/rag/chat`에 `userContext`·`noticeResults`를 보내지 않음 — 해결됨(2026-09-10)

- 위치: `Backend/core/llm_client.py:52-55`, `LLM/src/serving/schemas.py:111-117`
- 증상: 세법 챗봇이 정보 부족으로 끝나고 notice route가 동작하지 않음
- 원인: Backend가 카테고리와 질문만 보냄. `RagChatRequest`는 `userContext`·`noticeResults`를 받도록 정의돼 있고, `noticeResults`가 비면 LLM이 notice 분기를 통째로 비활성화함(`rag_routes.py:481-490`). Backend는 대신 프로필을 질문 문자열 앞에 붙임(`chat_service.py:57-64,81`)
- 주의: 두 모델 모두 정의되지 않은 필드를 거부하도록 설정돼 있어 필드명을 임의로 바꾸면 422가 됨

### 18. `sources[].url`을 버리고 `source`를 URL 자리에 넣음 — 해결됨(2026-09-10)

- 위치: `Backend/services/chat_service.py:64-74`, `LLM/src/serving/schemas.py:120-126`
- 증상: UI의 모든 인용 링크가 URL이 아닌 문자열을 가리킴
- 원인: `RagChatSource`는 `title`·`url`·`source`·`excerpt` 네 필드가 별도인데, Backend가 실제 `url`을 무시하고 `source`(문서·법령 이름)를 `answer_sources.url`에 저장함. 그 값이 그대로 `SourceItem.url`로 나감

### 19. `/rag/deductibility` 응답의 `sources`를 빈 배열로 덮어씀 — 해결됨(2026-09-10)

- 위치: `Backend/core/llm_client.py:112-118`
- 증상: `DeductibilityResponse.sources`가 정상 경로에서 항상 비어 있음
- 원인: 반환 dict에 빈 배열을 리터럴로 넣음. `grounded`·`status`도 함께 버려짐

### 20. 콜드 스타트에서 `/rag/chat`을 호출하지 않고, 질의마다 준비 상태를 다시 물음 — 해결됨(2026-09-10)

- 위치: `Backend/core/llm_client.py:33-40,50-51`
- 증상: 인덱싱 중에는 챗봇이 목업으로만 답함. 정상 상태에서도 챗봇 1건당 HTTP 왕복이 2~3회 추가됨
- 원인: `rag_answer`가 `ensure_index()` 실패 시 조기 반환함. 인덱싱은 25초를 훨씬 넘김. 또 `ensure_index()` 결과를 캐시하지 않아 질의마다 `/rag/ready`를 부르고, 실패하면 없는 `/internal/rag/ready`까지 부름
- 추가: 엔드포인트별 타임아웃(V1 §9의 3~180초)이 미적용이고 `LLM_TIMEOUT_SECONDS` 하나만 씀

### 21. 컨테이너에서 Backend가 `.env`를 하나도 읽지 못함

- 위치: `Backend/core/config.py:19-21`, `docker-compose.yml:5-9`
- 증상: compose 환경에서 메일 발송이 영구 불가함
- 원인: 바인드 마운트가 `./Backend:/app`이라 `BACKEND_ROOT`가 `/app`임. 따라서 상위 디렉터리의 `.env`는 컨테이너 루트로 해석되는데 마운트되지 않고, `/app/.env`도 저장소에 없음. compose는 `backend`에 `env_file`을 주지 않음(`llm`에는 줌). 결과적으로 compose의 `environment` 4개가 Backend가 보는 설정의 전부임
- 영향: `SMTP_HOST`가 빈 문자열로 남아 `notify_service.py:86`이 항상 로컬 대기열로 단락됨. `TOKEN_TTL_SECONDS`·`SQLITE_PATH`·`SMTP_*`도 주입되지 않음
- 비고: `Docs/STATUS.md` P0-1은 OpenAI·Cohere 키가 Backend로 새지 않도록 `env_file`을 일부러 뺐다고 기록함. 격리 의도는 유효하나, 그 결과 Backend가 자기 설정도 못 받는 상태임. 로컬 실행에서는 반대로 루트 `.env`의 LLM 키까지 전부 읽음

### 22. 세액감면 요청 본문이 조용히 버려짐

- 위치: `Frontend/src/App.jsx:1340-1344`, `Backend/api/tax.py:83-90`
- 증상: UI의 지역·나이·업종 선택 3개가 서버 판정에 아무 영향이 없음
- 원인: 프론트엔드는 세 값을 POST하는데 라우트가 본문 파라미터를 선언하지 않음. `tax_service.check_tax_reduction`은 DB 프로필로 판정함

### 23. 챗봇 응답에 프론트엔드가 읽는 `sources` 필드가 없음

- 위치: `Backend/schemas/chat.py:10-16`, `Frontend/src/App.jsx:535`
- 증상: RAG 인용 블록이 영구히 죽어 있음
- 원인: `ChatMessageResponse`에는 `messageId`·`answer`·`grounded`·`llmUsed`·`needsConfirmation`만 있음. 근거는 `GET /chat/messages/{id}/sources`에 따로 있고 프론트엔드는 그것을 호출하지 않음

---

## 5. P3 — 정합성·위생

### 24. `Backend/core/database.py`가 완전한 죽은 코드

- 위치: `Backend/core/database.py` 전체(8줄)
- 저장소 어디서도 `core.database`를 import하지 않음. `main.py:8`은 `core.db`에서 직접 가져옴
- `persist()`는 호출부가 0곳임. `db_path`·`init_db`를 import해 놓고 쓰지도 않아 같은 심볼에 대한 두 번째 경로만 만듦

### 25. 응답 48개 중 21개에 `response_model`이 없음

- 위치: `Backend/api/chat.py:33`, `Backend/api/admin.py:90-92,113-115`
- `GET /chat/messages`와 `GET /admin/policies`가 DB 행을 snake_case 그대로 반환함. 같은 `policies` 테이블이 경로에 따라 camelCase(`GET /policies`)와 snake_case(`GET /admin/policies`) 두 가지 모양으로 나감
- camelCase 변환이 `_to_item`·`_serialize_user` 등에 수작업으로 흩어져 있고 공통 별칭 생성기가 없음

### 26. SQLite 모드에서 `/health`의 `policies`가 항상 0

- 위치: `Backend/main.py:53-58`
- 시드가 정책 5건을 넣지만 저장 모드가 postgres일 때만 세도록 되어 있음

### 27. 다중 문장 작업에 원자성이 없음

- 위치: `Backend/core/db.py:298-321`, `Backend/core/repo.py:134,167,199,331`
- `fetchall`·`execute`·`insert`가 각각 커넥션을 새로 열고 닫음. `delete_chats`(행당 2문), `delete_event`(2문), `delete_expense`(3문), `insert_chat`(1+N문)과 모든 `upsert_*`(읽고-쓰기)가 별도 트랜잭션으로 쪼개짐
- 중단 시 `answer_sources`·`receipt_extractions` 고아 행이 남고, 동시 요청에서 `upsert_profile`·`upsert_reminder`가 중복 삽입될 수 있음
- `db.connection()`이 공개돼 있으나 이를 써서 묶는 호출부가 없음

### 28. `repo.count(table)`이 테이블명을 SQL에 문자열로 끼워 넣음

- 위치: `Backend/core/repo.py:472-473`
- 현재는 `api/admin.py:150-158`에서 하드코딩 리터럴만 전달하므로 실제 위험은 없으나 인젝션 형태의 API임

### 29. `repo.py`가 비공개 `db._iso`를 25회 직접 호출함

- 위치: `Backend/core/repo.py` 전반
- 계층 경계가 새는 형태임. `_iso`를 공개하거나 변환을 `db.insert` 안으로 옮기는 편이 맞음

### 30. `ocrSource` 값이 문서화된 열거값 밖이고 조회 시 값이 달라짐

- 위치: `Backend/services/expense_service.py:59,86`, `Backend/schemas/expenses.py:12`
- 스키마는 `llm / heuristic / mock`으로 문서화했는데 LLM은 `vision`을 반환하고 그대로 나감
- `get_extraction`은 실제 출처와 무관하게 `heuristic`을 하드코딩해, 같은 영수증이 등록 응답과 조회 응답에서 다른 값을 가짐
- 근본 원인은 `receipt_extractions`에 출처 컬럼이 없다는 점임(`DB/01_schema.sql:106-113`, `repo.insert_extraction`도 저장하지 않음)

### 31. `08_link_policy_calendar.sql`이 compose initdb에 마운트되지 않음

- 위치: `docker-compose.yml:49-50`
- `01_schema.sql`과 `app_extras.sql`만 마운트됨. 정책과 캘린더를 연결하는 SQL은 수동 실행해야 함
- `calendar_service.list_events`가 `policy_id` 소속으로 POLICY 이벤트를 거르므로(`calendar_service.py:37`) 연결되지 않은 이벤트는 화면에 보이지 않음

### 32. compose에 frontend 서비스가 없고 nginx 설정도 없음

- 위치: `docker-compose.yml`, `Frontend/Dockerfile`
- `Frontend/Dockerfile`은 nginx로 빌드하지만 설정 파일을 복사하지 않아 컨테이너에 `/api` 프록시가 존재하지 않음
- `vite.config.js`의 프록시 대상은 호스트 주소라 호스트에서 실행할 때만 유효함
- CORS 태도도 엇갈림. Backend는 모든 출처를 허용하고(`main.py:32`) LLM은 `.env`의 `CORS_ORIGINS`로 5173 포트만 허용함

### 33. 기타

| 항목 | 위치 |
| --- | --- |
| LLM 컨테이너에서 `HOST`·`PORT`·`RELOAD`가 무효. Dockerfile CMD가 포트를 하드코딩하고 `main()`을 거치지 않아 설정을 읽는 코드가 실행되지 않음 | `LLM/Dockerfile`, `LLM/main.py:7-15` |
| `/health`의 `ports`가 리터럴이라 compose 포트를 바꾸면 거짓 보고함 | `Backend/main.py:69` |
| `/internal/rag/recommendations`가 구현돼 있으나 Backend가 호출하지 않음. `policy_service.recommendations`는 로컬 규칙 점수만 씀 | `LLM/src/serving/rag_routes.py:953` |
| `auth.py`의 태그가 영문이라 `OPENAPI_TAGS`에 없고 Swagger에 미문서화 그룹으로 뜸. 다른 라우터는 한글 태그를 씀 | `Backend/api/auth.py:7`, `Backend/core/config.py:36-46` |
| `LLM_TIMEOUT_SECONDS` 값이 세 곳에서 엇갈림. compose 기본 25, `config.py` 기본 25, 실제 `.env` 120 | `docker-compose.yml:7`, `Backend/core/config.py:58` |
| `setup.sh` 0바이트 | `setup.sh` |

---

## 6. 확인 결과 문제가 아닌 것

오탐을 남겨 두면 다음 사람이 다시 조사하게 되므로 걸러낸 항목도 함께 기록함.

- **병합 잔재 없음.** `store` 참조·누락 심볼·시그니처 불일치·충돌 마커·중복 정의 전부 0건임. `core/repo.py`의 함수 58개와 모든 호출부를 대조했고 인자 개수·키워드까지 일치함
- **`Backend/data/app.db`는 최신 스키마임.** `expenses.user_id`를 포함해 `repo.py`가 요구하는 컬럼이 전부 있어 SQLite 폴백이 깨지지 않음
- **Backend가 부르는 V1 경로는 LLM에 전부 존재함.** `/rag/ready`·`/rag/reindex`·`/rag/chat`·`/rag/legal-basis`·`/rag/deductibility`·`/rag/summarize-announcement`·`/ocr/receipt` 모두 구현돼 있고 요청·응답 필드명이 맞음. 멀티파트 파트 이름도 일치함
- **`core/db.py`의 `SQLITE_DDL` 컬럼이 `01_schema.sql` + `app_extras.sql`과 일치함.** 테이블별로 대조함
- **`api/policies.py`의 라우트 순서가 올바름.** `/policies/recommendations`·`/policies/saved`가 `/policies/{policy_id}`보다 먼저 선언돼 있음
- **`store.py`의 `meta_ids` id 카운터가 모든 경로에서 제거됨.** DB 시퀀스로 대체됨
- **`core/config.py`에 설정 드리프트가 없음.** 정의된 속성 22개와 모든 참조가 일치함

---

## 7. 결정이 필요한 사항

없는 엔드포인트 5개(결함 3)는 어느 쪽을 계약으로 볼지에 따라 수정 대상이 갈림. 다섯 개 모두 `Docs/Design/API_SPEC.md`에 없으므로 설계상의 계약이 아님.

| 프론트엔드 호출 | 프론트엔드를 맞출 경우 | 비고 |
| --- | --- | --- |
| `GET /stats` | `/health`로 교체 | 프론트엔드가 `openAnnouncements`를 기대하는데 `/health`에 없음. 필드 추가 또는 매핑 조정 필요 |
| `GET /announcements?limit=N` | 대체 불가 | 프론트엔드가 `dday`·`sourceUrl`을 기대함. 둘 다 Backend 스키마 어디에도 없음. **공개 엔드포인트 신설이 필요한 유일한 항목** |
| `GET /calendar/upcoming` | `GET /calendar?year&month` 후 클라이언트 필터 | 결함 7의 필드명 수정과 함께 처리해야 함 |
| `GET /tax/schedule` | `GET /tax/calendar`로 교체 | 이름만 다름 |
| `GET /tax/documents` | 호출 제거 또는 공개 엔드포인트 신설 | 세법 자료를 일반 사용자에게 공개할지 결정 필요 |

---

## 8. 재현 방법

결함 10·11은 실데이터에서만 재현됨. 데모 5건짜리 SQLite로는 드러나지 않음. 정책 2,534건·청크 10,523건이 든 로컬 Postgres 기준임. 결함 4는 오탐이라 재현 대상이 아님.

```bash
TOKEN=$(curl -s -X POST localhost:8000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@demo.com","password":"demo123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

curl -s -o /dev/null -w '%{http_code} %{size_download} %{time_total}\n' \
  -H "Authorization: Bearer $TOKEN" localhost:8000/policies
```

쓰기가 발생하므로 재현 전후로 `policies`·`rag_documents`·`tax_documents` 건수를 비교해 `Docs/STATUS.md` P0-3 회귀가 없는지 함께 확인할 것.

## 9. 관련 문서

- 진행 현황: `Docs/STATUS.md`
- Backend↔LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md`
- Backend 연동 인계 지침: `Docs/Design/BACKEND_LLM_INTEGRATION_HANDOFF.md`
- API 명세: `Docs/Design/API_SPEC.md`
- 이전 보고서: `Docs/reports/LLM_INTEGRATION_AUDIT_0909.md`, `Docs/reports/LLM_REVIEW_ISSUES_RESOLUTION_0909.md`
