# Backend↔LLM 연동 인계서

- 작성일: `2026-09-09`
- LLM 계약: `Docs/Design/LLM_API_SPEC_V1.md`
- 대상: Backend·인프라 담당자
- 원칙: LLM 구현은 완료됐으며 이 문서는 Backend 코드 수정 없이 필요한 후속 작업을 인계한다.

## 1. 현재 상태

LLM은 다음 Backend용 공개 API를 제공한다.

| Method | Endpoint | 용도 |
| --- | --- | --- |
| `GET` | `/health` | LLM 프로세스 상태 |
| `GET` | `/rag/ready` | 모델·RAG 인덱스 준비 상태 |
| `POST` | `/rag/reindex` | 전체 또는 부분 재색인 |
| `POST` | `/rag/chat` | Policy·Notice·Tax 통합 질의 |
| `POST` | `/rag/legal-basis` | Backend 세액감면 판정 근거 설명 |
| `POST` | `/rag/deductibility` | 경비 인정 가능성 분석 |
| `POST` | `/rag/summarize-announcement` | 공고문 구조화 요약 |
| `POST` | `/ocr/receipt` | 영수증 Vision 필드 추출 |

LLM 테스트 결과는 `222 passed`다. Fake 모델과 임시 인덱스를 사용했으며 실제 OpenAI,
Cohere, PostgreSQL에는 요청하지 않았다. 현재 Backend는 일부 필드와 오류 계약을 아직
준수하지 않으므로 전체 서비스 연동 완료 상태는 아니다.

## 2. Backend 필수 수정 체크리스트

### 2.1 `Backend/core/llm_client.py`

- 문서 주석의 기준을 `LLM_API_SPEC_V1.md`로 변경한다.
- 다음 `/internal/*` fallback을 모두 제거한다.
  - `/internal/rag/ready`
  - `/internal/rag/index`
  - `/internal/rag/answer`
  - `/internal/ocr/receipt`
  - `/internal/summarize/announcement`
  - `/internal/explain/tax-reduction`
- `rag_answer()`가 `user_context`, `notice_results`를 선택적으로 받도록 확장한다.
- `sources[].url`을 우선 사용하고 URL이 없을 때만 `sources[].source`를 사용한다.
- `urllib.error.HTTPError`를 무조건 `None`으로 삼키지 않는다. 응답 JSON의
  `error.code`, `error.message`, `error.retryable`과 HTTP 상태를 구조화해 로그에 남긴다.
- 연결 실패·timeout·JSON 파싱 실패를 서로 구분한다. API Key, DB URL, 사용자 입력 원문은
  로그에 남기지 않는다.
- `ensure_index()`와 관리자 재색인을 분리한다.
  - 일반 질의 준비: `/rag/ready`가 준비되면 재색인을 생략할 수 있다.
  - 관리자 명시적 재색인: 준비 상태와 관계없이 `/rag/reindex`를 호출해야 한다.
- `documentIds`는 `rag_documents.id`다. 정책·공고·세법 원본 ID를 그대로 보내면 안 된다.
- PostgreSQL이 아닌 in-memory 모드에서는 비어 있지 않은 `documentIds`가 422를 반환한다.

권장 함수 경계:

```python
def ensure_index_ready() -> bool: ...
def reindex_rag(document_ids: list[int] | None, force: bool = False) -> dict: ...
def rag_answer(question: str, *, category: str,
               user_context: dict | None,
               notice_results: list[dict] | None) -> dict: ...
```

### 2.2 `Backend/services/chat_service.py`

현재 사용자 정보를 질문 문자열 앞에 붙이는 `_profile_prefix()`만으로는 나이·창업일 등
개인화 필드가 구조적으로 전달되지 않는다. 인증 사용자와 사업자 프로필을 다음 형태로
조립해 `rag_answer()`에 전달한다.

```json
{
  "userId": 1,
  "age": 29,
  "region": "서울",
  "businessType": "개인사업자",
  "industry": "소프트웨어",
  "businessRegisteredAt": "2026-02-01",
  "foundedAt": "2026-01-15"
}
```

- `userId`는 필수다.
- 없는 값은 `null`로 전달하며 임의로 추정하지 않는다.
- 날짜 객체는 `YYYY-MM-DD` 문자열로 직렬화한다.
- 구조화 Context를 전달한 뒤 중복되는 `_profile_prefix()` 삽입은 제거하는 것을 권장한다.

### 2.3 공고 조회와 `noticeResults`

실제 공고 조회·날짜 필터는 Backend 책임이다. `category=policy` 요청에서는 질문 조건으로
공고를 조회한 뒤 다음 형태로 전달한다.

```json
{
  "announcementId": 10,
  "policyId": 3,
  "title": "서울 청년창업 지원사업 모집",
  "content": "공고 원문 또는 검색용 요약",
  "benefit": "사업화 자금 최대 2천만원",
  "sourceUrl": "https://example.org/announcement/10",
  "applyStartDate": "2026-09-01",
  "applyEndDate": "2026-09-30"
}
```

값의 의미를 반드시 구분한다.

| 전달값 | 의미 | LLM 결과 |
| --- | --- | --- |
| 필드 누락 또는 `null` | Backend 조회 기능을 사용할 수 없음 | Notice route에서 `integration_unavailable` |
| `[]` | 조회 성공, 조건에 맞는 공고 없음 | Notice route에서 `no_result` |
| 결과 배열 | 조회 성공 | 전달받은 공고만으로 답변 |

LLM은 공고의 모집 상태를 자체 Vector 검색으로 판정하지 않는다.

### 2.4 응답 처리

`/rag/chat`의 주요 응답 필드는 다음과 같다.

```json
{
  "answer": "답변",
  "sources": [],
  "grounded": false,
  "route": "tax",
  "status": "insufficient_evidence",
  "guardrail_reason": "insufficient_evidence"
}
```

- `status=success`이고 `grounded=true`일 때만 근거가 확보된 답변으로 처리한다.
- `need_more_info`는 추가 사용자 입력을 요청한다.
- `integration_unavailable`은 공고 조회 또는 RAG 준비 실패로 안내한다.
- `out_of_scope`는 서비스 범위 밖 질문으로 처리하며 검색을 재시도하지 않는다.
- `sources`는 LLM이 실제로 인용한 문서만 저장한다.
- 세액감면 근거, 경비 분석, 공고 요약, OCR 응답의 `llmUsed`를 Backend 외부 응답에 보존한다.

### 2.5 공통 오류 처리

LLM의 모든 비-2xx 응답은 다음 형식이다.

```json
{
  "error": {
    "code": "RAG_INDEX_NOT_READY",
    "message": "RAG index is not ready.",
    "retryable": true
  }
}
```

Backend 처리 권장안:

| HTTP | 대표 코드 | 처리 |
| --- | --- | --- |
| `409` | `RAG_INDEX_NOT_READY` | 준비 상태 확인 후 관리자·운영 절차로 재색인 |
| `413` | `PAYLOAD_TOO_LARGE` | 사용자에게 4 MiB 제한 안내 |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | JPEG·PNG·WebP 안내 |
| `422` | `VALIDATION_ERROR` | 요청 조립 오류 또는 사용자 입력 오류 구분 |
| `429` | `RATE_LIMITED` | 자동 POST 재시도 금지, 잠시 후 재요청 안내 |
| `502` | `UPSTREAM_RESPONSE_ERROR` | LLM 응답 검증 실패로 기록 |
| `503` | `SERVICE_UNAVAILABLE` | 모델·DB·연결 설정 확인 |
| `504` | `UPSTREAM_TIMEOUT` | timeout으로 기록하고 사용자에게 재시도 안내 |

## 3. Endpoint별 Backend 확인사항

### `/rag/legal-basis`

- Backend가 `eligible`, `reasons`, `conditions`를 전달한다.
- LLM은 `eligible` 판정을 변경하지 않고 `legalBasis`만 생성한다.
- 호출 전 RAG 인덱스가 준비되지 않으면 409가 발생한다.
- `legalBasis`와 `sources`가 없으면 Backend의 Rule 판정만 표시하고 최종 판단이 아니라는
  안내를 유지한다.

### `/rag/deductibility`

- 요청: `category`, `amount`, `vendor`, `items`
- 응답: `deductible`, `confidence`, `basis`, `sources`, `grounded`, `status`, `llmUsed`
- 경비 인정 여부는 참고 가능성이므로 사용자 화면에서 확정 판정처럼 표현하지 않는다.

### `/rag/summarize-announcement`

- Backend가 원문과 출처를 전달한다.
- `source`는 LLM이 새로 만들지 않고 요청값을 보존한다.
- `announcement_summaries` 캐시 조회·저장은 계속 Backend가 담당한다.

### `/ocr/receipt`

- `multipart/form-data`의 파일 필드명은 `image`다.
- 허용 형식: JPEG, PNG, WebP
- 최대 크기: 4 MiB
- 인식하지 못한 필드는 `null` 또는 빈 배열이므로 Backend가 샘플 값으로 오인하지 않아야 한다.
- 실제 영수증 인식 품질은 아직 검증하지 않았다.

### `/rag/reindex`

- `documentIds` 누락 또는 `[]`: 전체 원천 문서 동기화
- 값 존재: PostgreSQL `rag_documents.id` 행만 부분 재색인
- `force=false`: 동일 본문은 기존 Embedding 재사용
- `force=true`: 지정 대상을 다시 Embedding
- 명시적 관리자 요청은 현재 인덱스가 준비돼 있어도 LLM에 전달한다.
- 부분 재색인은 대상 외 `rag_documents`를 삭제하지 않는다.
- `policies`, `announcements`, `tax_documents` 원본은 LLM이 수정하지 않는다.

## 4. Timeout과 재시도

`Backend/core/config.py`의 단일 25초 timeout만 사용하면 OCR·요약·재색인이 조기에 종료될 수
있다. Endpoint별 제한을 적용한다.

| Endpoint | 제한 |
| --- | ---: |
| `/health`, `/rag/ready` | 3초 |
| `/rag/chat`, `/rag/legal-basis`, `/rag/deductibility` | 30초 |
| `/rag/summarize-announcement` | 45초 |
| `/ocr/receipt` | 60초 |
| `/rag/reindex` | 180초 |

- GET 상태 조회만 연결 실패 또는 502·503·504에서 최대 한 번 재시도한다.
- POST는 비용·중복 작업 방지를 위해 자동 재시도하지 않는다.

## 5. Docker·환경 설정

- 로컬 실행: `LLM_API_URL=http://127.0.0.1:8001`
- Docker Compose: `LLM_API_URL=http://llm:8001`
- 컨테이너의 `127.0.0.1`은 Backend 자신이므로 LLM 연결 주소로 사용할 수 없다.
- Backend 컨테이너에는 OpenAI·Cohere Key를 전달하지 않는다.
- LLM 컨테이너에만 모델·Embedding·Cohere·DB 환경변수를 전달한다.

## 6. 담당자 통합 테스트 순서

실제 모델 호출과 재색인은 외부 전송·비용·DB 파생 데이터 변경이 발생하므로 팀 승인 후
실행한다.

1. `GET http://llm:8001/health`가 200인지 확인한다.
2. `GET http://llm:8001/rag/ready`에서 모델 설정과 인덱스 상태를 확인한다.
3. 인덱스가 준비되지 않은 경우 승인 후 전체 `/rag/reindex`를 한 번 실행한다.
4. Backend `/chat/messages`에서 일반 Policy 질문을 확인한다.
5. 인증 프로필이 포함된 개인화 Policy·Tax 질문을 확인한다.
6. `noticeResults=null`, `[]`, 결과 존재 세 경우를 확인한다.
7. 세액감면 판정 결과가 LLM 설명에 의해 뒤집히지 않는지 확인한다.
8. 영수증 이미지를 한 장씩 JPEG·PNG로 확인한다.
9. 공고 요약의 날짜·금액이 원문에 없는 값으로 생성되지 않는지 확인한다.
10. 422·409·429·503·504 응답이 Backend 로그와 사용자 안내로 구분되는지 확인한다.

## 7. 통합 완료 기준

- Backend에서 `/internal/*` LLM 경로 호출이 없다.
- 필요한 모든 요청이 404 없이 LLM에 도달한다.
- 개인화 질문에 구조화된 `userContext`가 전달된다.
- Notice 질문에 Backend 조회 결과가 전달된다.
- `status`, `guardrail_reason`, `sources`, `llmUsed`가 유실되지 않는다.
- 관리자 재색인이 준비 상태와 관계없이 실행된다.
- HTTP 오류가 단순 `None`으로 사라지지 않고 코드별로 기록된다.
- Docker 환경에서 Backend가 `http://llm:8001`에 연결된다.
- 승인된 실제 OpenAI·Cohere·PostgreSQL 통합 테스트가 통과한다.

## 8. 알려진 제한사항

- 실제 모델과 실제 영수증 이미지 품질은 아직 검증하지 않았다.
- PostgreSQL 부분 재색인은 `rag_documents.id`가 이미 존재하는 행에만 사용할 수 있다.
  신규 원천 문서는 전체 재색인으로 최초 Chunk를 생성해야 한다.
- in-memory 모드는 DB 행 ID가 없으므로 부분 재색인을 지원하지 않는다.
- LLM 단독 테스트 통과는 현재 Backend 코드의 계약 준수를 증명하지 않는다.
- 원본 설계 문서 `Docs/Design/LLM_API_SPEC.md`와 일부 아키텍처 문서에는 과거 포트·응답
  예시가 남아 있으므로 V1과 이 인계서를 연동 기준으로 사용한다.
