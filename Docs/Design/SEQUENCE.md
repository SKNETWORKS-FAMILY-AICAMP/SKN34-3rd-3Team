# 시퀀스 다이어그램

핵심 유스케이스의 컴포넌트 간 호출 흐름을 정리한다. 참여자 구성은 `Docs/ARCHITECTURE.md`의 계층 명칭(Controller=`Backend/api`, Service=`Backend/services`)을 그대로 따른다.

## 1. 청년창업 세액감면 자동판정 (FS-13)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend(api)
    participant SVC as Backend(service)
    participant DB as DB
    participant LLM as LLM 서비스

    FE->>API: POST /tax/tax-reduction/check
    API->>SVC: 판정 요청 전달
    SVC->>DB: User/BusinessProfile 조회
    DB-->>SVC: 개인·사업자 정보
    SVC->>SVC: Rule 기반 요건 판정 (나이/지역/업종/창업시점)
    SVC->>LLM: 판정 근거 설명 요청 (RAG)
    LLM-->>SVC: 관련 법령·근거 문서
    SVC->>DB: TaxReductionResult 저장
    SVC-->>API: 판정 결과 + 근거
    API-->>FE: 200 OK (eligible, reasons, legalBasis)
```

Rule 기반 판정과 RAG 근거 제시를 결합하는 것이 핵심 차별점(FS-13)이므로, Service가 판정 로직을 직접 수행한 뒤 LLM 서비스에는 근거 설명만 요청하는 구조로 그렸다.

## 2. AI 챗봇 Q&A + 답변 근거 확인 (FS-05, FS-06, FS-08)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend(api)
    participant SVC as Backend(service)
    participant LLM as LLM 서비스
    participant DB as DB

    FE->>API: POST /chat/messages { category, question }
    API->>SVC: 질의 전달
    SVC->>LLM: RAG 검색 + 응답 생성 요청
    LLM-->>SVC: 답변 + 근거 문서 목록
    SVC->>DB: ChatMessage, AnswerSource 저장
    SVC-->>API: 답변
    API-->>FE: 200 OK (messageId, answer)

    Note over FE,API: 이후 근거 확인 요청
    FE->>API: GET /chat/messages/{messageId}/sources
    API->>SVC: 근거 조회 요청
    SVC->>DB: AnswerSource 조회
    DB-->>SVC: 근거 문서 목록
    SVC-->>API: 근거 목록
    API-->>FE: 200 OK (sources)
```

답변 생성 시점에 근거 문서를 함께 저장해두므로, 이후 "답변 근거 확인"(FS-08)은 LLM을 다시 호출하지 않고 DB 조회만으로 처리한다.

## 3. 영수증 지출 분석 (FS-14 ~ FS-17)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend(api)
    participant SVC as Backend(service)
    participant LLM as LLM 서비스
    participant DB as DB

    FE->>API: POST /expenses/receipts (이미지 업로드)
    API->>SVC: 영수증 등록 요청
    SVC->>DB: Receipt 저장 (status: pending)
    SVC->>LLM: OCR/Vision 정보 추출 요청
    LLM-->>SVC: 날짜·상호·금액 등 추출 결과
    SVC->>DB: ReceiptExtraction 저장
    SVC->>SVC: 지출 분류 + 경비처리 가능성 분석 (RAG 근거 포함)
    SVC->>DB: Expense 저장
    SVC-->>API: 처리 완료
    API-->>FE: 200 OK (receiptId, status)
```

영수증 등록(FS-14) → OCR 추출(FS-15) → 지출 분류(FS-16) → 경비처리 가능성 분석(FS-17)이 하나의 흐름으로 이어지며, Frontend는 등록 요청 한 번만 보내고 나머지는 Backend/LLM이 내부에서 처리한다.

## 관련 문서

- 전체 시스템 구성·계층 구조: `Docs/ARCHITECTURE.md`
- 기능 정의: `Docs/FUNCTIONAL_SPEC.md`
- 데이터 구조: `Docs/ERD.md`
