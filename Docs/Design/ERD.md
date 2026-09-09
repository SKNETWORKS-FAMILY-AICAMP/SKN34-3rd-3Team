# ERD

`Docs/API_SPEC.md`, `Docs/FUNCTIONAL_SPEC.md`에서 드러난 데이터를 기준으로 정리한 관계형 스키마다.

```mermaid
erDiagram
    users ||--o| business_profiles : has
    users ||--o{ chat_messages : sends
    chat_messages ||--o{ answer_sources : cites
    users ||--o| tax_info : manages
    calendar_events ||--o{ reminders : triggers
    users ||--o{ reminders : sets
    policies ||--o{ calendar_events : "due date of"
    policies ||--o{ rag_documents : "chunked into"
    users ||--o{ tax_reduction_results : requests
    users ||--o{ receipts : uploads
    receipts ||--o| receipt_extractions : "extracted as"
    receipts ||--o{ expenses : yields
    admin_users ||--o{ policies : manages
    policies ||--o{ announcements : posts
    announcements ||--o| announcement_summaries : "summarized as"
    users ||--o{ saved_policies : saves
    policies ||--o{ saved_policies : "saved by"
    admin_users ||--o{ tax_documents : uploads

    users {
        int id PK
        string email
        string password_hash
        string name
        int age
        string region
        datetime created_at
    }

    business_profiles {
        int id PK
        int user_id FK "UNIQUE"
        string business_type
        string industry
        date business_registered_at
        date founded_at
    }

    chat_messages {
        int id PK
        int user_id FK
        string category
        string question
        string answer
        datetime created_at
    }

    answer_sources {
        int id PK
        int message_id FK
        string title
        string url
        string excerpt
    }

    tax_info {
        int id PK
        int user_id FK
        string tax_type
        string details
        datetime updated_at
    }

    calendar_events {
        int id PK
        string event_type "TAX / POLICY"
        string business_type "TAX 타입일 때만 사용"
        int policy_id FK "POLICY 타입일 때만 사용"
        string title
        date due_date
        string description
    }

    reminders {
        int id PK
        int user_id FK
        int event_id FK
        datetime notify_at
        datetime created_at
    }

    tax_reduction_results {
        int id PK
        int user_id FK
        boolean eligible
        string reasons
        string legal_basis
        datetime judged_at
    }

    receipts {
        int id PK
        int user_id FK
        string image_url
        string status "DEFAULT 'pending'"
        datetime created_at
    }

    receipt_extractions {
        int id PK
        int receipt_id FK "UNIQUE"
        date date
        string vendor
        int amount
        string items
    }

    expenses {
        int id PK
        int receipt_id FK
        string category
        int amount
        date date
        boolean deductible
        float deductible_confidence
        string deductible_basis
    }

    policies {
        int id PK
        int admin_id FK
        string title
        string region
        string industry
        string target
        string benefit
        string eligibility_rule
        string source
        datetime created_at
    }

    announcements {
        int id PK
        int policy_id FK
        string raw_content
        string source_url
        date apply_start_date
        date apply_end_date
        datetime created_at
    }

    announcement_summaries {
        int id PK
        int announcement_id FK "UNIQUE"
        string target
        string benefit
        string period
        string documents
        string notes
        string source
    }

    saved_policies {
        int id PK
        int user_id FK "UNIQUE with policy_id"
        int policy_id FK "UNIQUE with user_id"
        datetime saved_at
    }

    admin_users {
        int id PK
        string email
        string password_hash
        string role
        datetime created_at
    }

    tax_documents {
        int id PK
        int admin_id FK
        string title
        string law_name
        string content
        string source
        datetime created_at
    }

    rag_documents {
        int id PK
        string source_type
        int source_id
        string chunk_id "UNIQUE"
        int policy_id FK
        string content
        string embedding_status
        vector embedding "VECTOR(1536)"
        datetime updated_at
    }
```

## 모델링 노트

- **User – BusinessProfile**: 1:1. 개인정보(FS-03)와 사업자 정보(FS-04)를 분리해 API도 별도 엔드포인트로 관리한다.
- **User – ChatMessage – AnswerSource**: 챗봇 질의응답(FS-05~07)과 답변 근거(FS-08)를 1:N으로 연결해, 답변마다 근거 문서를 복수로 저장할 수 있게 한다.
- **CalendarEvent – Reminder**: `CalendarEvent`는 홈 화면 캘린더(FS-11)에 노출되는 일정 마스터 데이터로, `event_type`에 따라 세금 신고 일정(TAX, `business_type` 사용)과 지원정책 신청 마감일(POLICY, `policy_id` 사용)을 함께 담는다. `Reminder`는 사용자가 특정 일정(세금·지원금 무관)에 건 알림이다.
- **Policy – CalendarEvent**: 정책의 신청 마감일(`Announcement.apply_end_date`)을 기준으로 생성되는 POLICY 타입 `CalendarEvent`를 위한 관계다. `Announcement`에 `apply_start_date`/`apply_end_date` 구조화 필드를 추가한 이유는, `AnnouncementSummary.period`가 AI 요약 문자열이라 캘린더 렌더링에 쓸 신뢰 가능한 날짜 값이 아니기 때문이다.
- **Receipt – ReceiptExtraction – Expense**: 영수증 등록(FS-14) → OCR 추출 결과(FS-15, 1:1) → 지출 항목(FS-16, FS-17 포함, 1:N) 순서로 이어진다. 영수증 한 장에 여러 지출 항목이 나올 수 있어 `Expense`는 `Receipt`의 자식으로 둔다.
- **Policy – Announcement – AnnouncementSummary**: 정책(마스터 데이터) 하나에 여러 시점의 공고문이 달릴 수 있고(1:N), 공고문 하나는 AI 요약 결과 하나를 가진다(1:1).
- **User – Policy (SavedPolicy)**: 관심 정책 저장(FS-23)을 위한 다대다 조인 테이블.
- **AdminUser – Policy / TaxDocument**: 관리자가 등록한 데이터의 출처를 추적하기 위한 FK.
- **RagDocument**: 원천 문서 참조와 실제 FK가 섞여 있는 구조다.
    - `source_type`(`tax_document`/`policy`/`announcement`) + `source_id`: `tax_documents`·`policies`·`announcements` 여러 테이블을 대상으로 하므로 DB 레벨 FK를 걸지 않은 논리적 참조다. 벡터DB 임베딩 상태(FS-27)도 여기서 추적한다.
    - `policy_id`: `policies(id)`를 가리키는 실제 FK다. 정책 단위 검색 필터(`LLM/src/vectorstores/postgres.py:170`)와 정책 제목 조인(`:162`)에 쓰인다. 세법 문서 청크는 이 값이 `NULL`이라 관계가 `0..*`다.
    - `chunk_id`: 청크 본문 hash 기반 UNIQUE 키다. 재색인 시 `ON CONFLICT (chunk_id) DO UPDATE`(`LLM/src/vectorstores/postgres.py:82`)로 중복 삽입 대신 갱신한다.
    - ⚠️ `policy_id` FK 때문에 `TRUNCATE policies ... CASCADE`가 `rag_documents`까지 함께 비운다. `Backend/core/postgres.py:178`이 이 TRUNCATE를 실행하므로, Backend 쓰기 한 번에 LLM 벡터 인덱스가 사라진다.
- **PolicyEligibility(FS-20)**: 별도 테이블로 저장하지 않는다. `Policy.eligibility_rule`과 `User`/`BusinessProfile` 값을 요청 시점에 비교해 계산하는 값이라 저장이 불필요하다.
- **시스템 모니터링(FS-28)**: 관계형 DB 엔티티로 모델링하지 않는다. 로그/지표 수집은 별도 관측 도구 영역으로 본다.

## 구현 노트

위 다이어그램은 `DB/01_schema.sql`(PostgreSQL + pgvector)의 실제 테이블 구조에 맞춰 동기화했다. 컬럼 단위 제약(`NOT NULL`, `ON DELETE CASCADE` 등)과 `01_schema.sql` 작성 시점의 세부 결정 사유는 중복 기술하지 않고 `DB/01_schema.sql` 하단 "ERD와 다른 사항" 주석을 참조한다.

### 스키마에 없는데 Backend가 참조하는 항목

`Backend/core/postgres.py`가 INSERT·SELECT 하지만 `DB/01_schema.sql`에는 없는 테이블·컬럼이다. 위 다이어그램은 SQL 기준이므로 반영하지 않고 목록으로만 남긴다. 어느 쪽을 맞출지는 미정이다.

| 대상 | 없는 항목 | 참조 위치 |
| --- | --- | --- |
| 테이블 | `notifications`, `meta_ids` | `postgres.py:157`, `postgres.py:175` |
| `users` | `phone`, `status` | `postgres.py:186` |
| `calendar_events` | `user_id` | `postgres.py:252` |
| `reminders` | `dispatched` | `postgres.py:266` |
| `expenses` | `user_id` | `postgres.py:307` |
| `announcements` | `apply_method` | `postgres.py:322` |
| `announcement_summaries` | `llm_used` | `postgres.py:336` |

`Backend/core/database.py`의 SQLite DDL에는 위 항목이 모두 있고 `_migrate()`가 컬럼을 추가하지만, Postgres 쪽에는 대응 마이그레이션이 없다.

### SQL 파일 자체의 미해결 항목

- `DB/scripts/09_add_rag_columns.sql`은 `01_schema.sql:165-175`가 이미 만든 `chunk_id`/`policy_id`/`content`를 다시 `ADD COLUMN` 한다. `DB/run_all.sh` 순서대로 실행하면 `column "chunk_id" of relation "rag_documents" already exists`로 실패한다.
- `DB/run_all.sh:2` 주석의 스키마 경로는 `scripts/01_schema.sql`이지만 실제 파일은 `DB/01_schema.sql`이다.
- `rag_documents.embedding`에 벡터 인덱스가 없다. 저장소 전체에 `ivfflat`/`hnsw`/`vector_cosine_ops`가 한 번도 나오지 않아 유사도 검색이 전건 스캔이다.
- `Backend/core/postgres.py:14-15`가 읽으려는 `DB/schema.sql`, `DB/app_extras.sql`은 존재하지 않는다. 파일이 없으면 조용히 넘어가므로 Backend 단독 부트스트랩으로는 스키마가 만들어지지 않는다.
