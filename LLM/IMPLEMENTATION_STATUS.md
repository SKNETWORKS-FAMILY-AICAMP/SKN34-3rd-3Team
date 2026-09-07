# LLM 구현 현황 및 단계별 개발 계획

작성 기준일: 2026-09-07  
기준 브랜치: `feature/LLM`

## 1. 현재 구현 수준

- 정책 RAG MVP 기준: 약 75~80%
- 프로젝트 설계 문서의 전체 LLM·AI 범위 기준: 약 50~60%
- 개발 단계: 로컬 정책 RAG MVP와 1차 검색 고도화 완료, 실제 시스템 통합 전

현재는 정책 PDF를 처리하고 검색 근거를 이용해 답변하는 흐름이 완성되어 있다.
다만 사용자·정책 데이터는 Mock이고 Vector Store는 In-memory 방식이므로 실제
Backend 및 PostgreSQL + pgvector와 연결하는 작업이 남아 있다.

## 2. 구현된 부분

### 2.1 서비스와 모델 설정

- FastAPI 기반 LLM 내부 서비스
- Pydantic Settings 기반 환경변수 로딩 및 검증
- OpenAI Chat Model 및 Embedding Model 생성
- `uv`, `pyproject.toml`, `uv.lock` 기반 의존성 관리
- Health 및 RAG 준비 상태 확인 API
- LangSmith 입력·출력 및 RAG 실행 흐름 추적

관련 코드:

- `src/core/config.py`
- `src/core/langsmith.py`
- `src/models/factory.py`
- `src/serving/app.py`
- `src/serving/rag_routes.py`

### 2.2 정책 문서 처리와 인덱싱

- `RAG_data` 폴더의 PDF 자동 탐색
- PDF 페이지별 텍스트 추출
- 정책 ID, 제목, 파일명, 페이지 metadata 유지
- `RecursiveCharacterTextSplitter` 기반 Chunking
- 현재 Chunk 설정: 1,000자, overlap 150자
- `text-embedding-3-small` 기반 1,536차원 Embedding
- 문서 20개, Chunk 100개 인덱싱
- 원본 PDF hash, Embedding 모델, Chunk 설정을 이용한 캐시 유효성 확인
- 유효한 캐시가 있으면 문서 재임베딩 생략

관련 코드:

- `src/data/document_catalog.py`
- `src/features/document_processing.py`
- `src/features/indexing.py`
- `src/vectorstores/in_memory.py`

### 2.3 검색

- 기존 Dense Search 유지
- Dense와 동일한 Chunk 대상 BM25 Search
- `chunk_id` 기준 Reciprocal Rank Fusion(RRF)
- Dense + BM25 + RRF Hybrid Search
- 환경변수로 Dense와 Hybrid 실행 방식 전환
- 정책 ID 기반 검색 범위 제한
- 검색 결과 metadata와 score 유지

현재 기본 설정:

```env
RETRIEVAL_MODE=hybrid
DEFAULT_TOP_K=5
HYBRID_DENSE_CANDIDATE_K=20
HYBRID_BM25_CANDIDATE_K=20
HYBRID_RRF_K=60
```

관련 코드:

- `src/rag/retriever.py`
- `src/vectorstores/base.py`
- `src/vectorstores/in_memory.py`
- `src/vectorstores/hybrid.py`

### 2.4 RAG 답변 생성

- LangChain PromptTemplate 기반 답변 생성
- 특정 정책에 대한 근거 기반 질의응답
- 사용자 프로필 기반 관련 정책 추천
- Pydantic Structured Output
- 정책별 자격, 지원 내용, 신청기간 구조화
- 답변과 함께 정책 ID, 원본 파일, 페이지, 인용문 반환
- 사용자 화면용 간결한 정책 추천 포맷

관련 코드:

- `src/rag/prompts.py`
- `src/rag/chain.py`
- `src/rag/context_builder.py`
- `src/rag/contracts.py`
- `src/rag/service.py`
- `src/rag/discovery.py`

### 2.5 Backend 판정 결과 설명 구조

- Backend가 계산했다고 가정한 `eligible`, `reasons` 입력 구조
- LLM이 판정 결과를 재계산하거나 변경하지 않도록 Prompt에 명시
- 판정 결과와 RAG 문서 근거를 결합한 자연어 설명
- 입력받은 판정 결과를 응답에도 그대로 포함

현재 지원하는 내부 요청 형태:

```json
{
  "question": "내가 이 정책 대상이야?",
  "policy_id": 101,
  "decision": {
    "eligible": true,
    "reasons": [
      "연령 조건 충족",
      "지역 조건 충족"
    ]
  }
}
```

관련 코드:

- `src/serving/schemas.py`
- `src/serving/rag_routes.py`
- `src/rag/prompts.py`
- `src/rag/service.py`

### 2.6 Guardrail과 생성 검증

- 관련 없는 질문 차단
- 정책 질문과 다른 분야가 섞인 복합 질문 차단
- 질문 길이 및 Top-K 검증
- 검색 근거가 없을 때 답변 생성 제한
- 검색되지 않은 정책 ID 생성 차단
- 존재하지 않는 출처 번호 차단
- 정책 ID와 출처 정책이 다른 경우 차단
- 검색 문서 내부 Prompt Injection 지시를 따르지 않도록 Prompt 구성

관련 코드:

- `src/rag/guardrails.py`
- `src/rag/prompts.py`

### 2.7 테스트와 평가

- PDF 로딩 및 Chunking 테스트
- Embedding 및 로컬 캐시 테스트
- Dense, BM25, RRF, Hybrid Search 테스트
- Structured Output 및 출처 검증 테스트
- Guardrail 및 FastAPI 테스트
- 20개 정책이 포함된 평가 질문 30개
- P@K, R@K, MRR, AP/MAP 평가 코드
- Dense와 Hybrid 성능 비교 완료

최근 Hybrid 검색 평가 결과:

| 지표 | Dense | Hybrid |
| --- | ---: | ---: |
| Recall@3 | 0.7667 | 0.9167 |
| Recall@5 | 0.8667 | 0.9167 |
| Precision@3 | 0.3333 | 0.4000 |
| MRR@5 | 0.9000 | 0.9667 |

현재 전체 자동 테스트 실행 결과는 `115 passed`이다.

관련 코드 및 데이터:

- `src/evaluation/`
- `evaluation/sample_cases.json`
- `evaluation/results/`
- `tests/`

## 3. 부분적으로 구현된 부분

### 3.1 사용자 및 정책 데이터

- 사용자 프로필과 Backend 판정 결과의 구조는 존재한다.
- 현재 사용자 3명과 일부 정책 정보만 Mock Dictionary로 제공한다.
- 실제 Backend API 또는 DB에서 데이터를 가져오지는 않는다.

### 3.2 Vector Store

- 향후 저장소를 교체할 수 있는 `VectorSearch` 계약은 존재한다.
- 현재 구현은 In-memory Vector Store와 JSON 캐시이다.
- PostgreSQL + pgvector 적재, 검색, 갱신 기능은 없다.

### 3.3 문서 재색인

- 전체 문서 재생성과 강제 재색인은 가능하다.
- 원본 파일 hash를 통한 캐시 무효화가 가능하다.
- 문서 ID별 증분 재색인과 `embedding_status` 관리는 없다.
- Scheduler, Queue 및 관리자 API와 연결되지 않았다.

### 3.4 정책 공고문 구조화

- 정책 추천 과정에서 자격, 제한 조건, 지원 내용, 신청기간을 구조화한다.
- 설계 문서의 공고문 전용 응답인 `target`, `benefit`, `period`, `documents`,
  `notes`, `source`와 완전히 일치하는 전용 기능은 없다.
- 신청 방법과 제출서류를 독립 필드로 반환하는 API가 없다.

### 3.5 Guardrail과 평가

- 현재 Guardrail은 키워드 및 규칙 기반 1차 구현이다.
- Prompt Injection, 개인정보, 법률·세무 위험 표현에 대한 전문 분류기는 없다.
- 평가셋은 정책 검색 중심이고 차단 질문이 없어 Guardrail 성능 평가는 제한적이다.
- 정답 답변과 정답 Chunk가 없어 답변 충실성 및 인용 정확도 평가는 부족하다.
- 현재 검색 평가는 순수 Retriever 결과가 아니라 최종 LLM 정책 선택도 포함한다.

## 4. 앞으로 구현해야 하는 부분

### 1단계: Backend·DB 계약 확정

목표: Mock을 실제 시스템으로 교체하기 전에 팀 간 데이터 계약을 고정한다.

- [ ] Backend가 LLM에 전달할 내부 REST endpoint 확정
- [ ] 정책 추천 요청에서 사용자 정보를 직접 전달할지 `user_id`만 전달할지 확정
- [ ] 세액감면 판정 입력의 `eligible`, `reasons`, 정책 또는 세법 문서 ID 확정
- [ ] LLM 응답의 answer, sources, limitations, error 구조 확정
- [ ] Backend timeout, retry 및 오류 코드 처리 방식 합의
- [ ] `RagDocument`가 문서 단위인지 Chunk 단위인지 DB 담당자와 확인
- [ ] `source_type`, `source_id`, `chunk_id`, page 및 metadata 저장 방식 확정
- [ ] Embedding 차원 1,536과 모델 변경 정책 확정

완료 기준:

- Backend와 LLM이 공유하는 요청·응답 예제 및 Pydantic schema가 확정된다.
- pgvector에 저장할 Chunk 단위 schema와 metadata가 확정된다.

### 2단계: PostgreSQL + pgvector 연동

목표: In-memory 저장소를 실제 운영 Vector Store로 교체한다.

- [ ] PostgreSQL 연결 환경변수 추가
- [ ] pgvector 연결 라이브러리와 드라이버 결정
- [ ] 현재 `VectorSearch` 계약을 구현하는 pgvector 검색 구현체 작성
- [ ] Chunk 본문, Embedding 및 metadata 적재
- [ ] 정책 ID와 source type 기반 metadata filtering 구현
- [ ] Cosine distance 또는 검색 연산자와 Vector index 방식 확정
- [ ] 중복 적재 방지를 위한 upsert 기준 정의
- [ ] 트랜잭션 및 연결 실패 처리
- [ ] Dense 검색 결과가 기존 baseline과 호환되는지 확인

완료 기준:

- In-memory 대신 pgvector를 사용해 동일 RAG API가 정상 동작한다.
- 서버 재시작 후에도 별도 JSON 캐시 없이 검색할 수 있다.

### 3단계: 실제 Backend 연동

목표: Mock 사용자와 판정 결과를 실제 Backend 데이터로 교체한다.

- [ ] Mock 사용자 조회를 Backend 요청 데이터 또는 API 응답으로 교체
- [ ] 정책 추천 요청에 실제 사용자·사업자 정보 반영
- [ ] Backend 세액감면 판정 결과를 LLM 설명 API에 연결
- [ ] LLM이 `eligible`, `reasons`를 변경하지 않는 통합 테스트 작성
- [ ] LLM 출처 응답을 Backend의 `AnswerSource` 저장 구조와 연결
- [ ] Frontend가 LLM을 직접 호출하지 않고 Backend만 호출하도록 전환
- [ ] 인증정보 또는 내부 네트워크 접근 제한 적용

완료 기준:

- Frontend → Backend → LLM → pgvector 흐름이 실제 데이터로 동작한다.
- 답변과 출처가 Backend를 거쳐 사용자에게 반환되고 저장된다.

### 4단계: 세법 RAG와 공고문 전용 기능

목표: 정책 문서에 한정된 현재 RAG를 설계 문서의 전체 문서 범위로 확장한다.

- [ ] 검증된 세법·국세청 공식 문서 확보
- [ ] 세법 문서의 법령명, 조문, 시행일, 버전 metadata 정의
- [ ] 정책·세법·공고문 `source_type` 분리
- [ ] 질문 category 또는 의도 분류 구현
- [ ] 세금·경비처리·절세 Q&A 구현
- [ ] 세무·법률 자문 대체 불가 안내 적용
- [ ] Backend 세액감면 판정에 대한 법령 근거 설명 구현
- [ ] 공고문 전용 Structured Output schema 구현
- [ ] 지원 대상, 지원 내용, 기간, 방법, 제출서류, 유의사항 반환

완료 기준:

- 정책 질문과 세무 질문이 적절한 문서 집합을 검색한다.
- 공고문 요약이 설계 문서의 응답 필드를 안정적으로 반환한다.

### 5단계: 문서 관리와 증분 재색인

목표: 문서 변경 시 전체 문서를 다시 임베딩하지 않는 운영 구조를 만든다.

- [ ] 신규·수정·삭제 문서 감지
- [ ] 문서 ID별 Chunk 생성 및 증분 Embedding
- [ ] 삭제 또는 변경된 기존 Chunk 정리
- [ ] `embedding_status`와 `updated_at` 갱신
- [ ] 관리자 `documentIds` 선택 재색인 연결
- [ ] 실패 문서 재처리 및 상태 확인 기능
- [ ] 장시간 재색인 작업의 비동기 Queue 필요성 검토

완료 기준:

- 한 문서가 변경됐을 때 해당 문서 Chunk만 안전하게 갱신된다.
- 관리자가 재색인 상태와 실패 원인을 확인할 수 있다.

### 6단계: 평가 및 검색 품질 고도화

목표: 실제 데이터 기준으로 검색과 생성 품질을 분리해 개선한다.

- [ ] 실제 사용자 표현을 반영한 평가 질문 확장
- [ ] 순수 Retriever 평가와 최종 LLM 응답 평가 분리
- [ ] 정답 Chunk 및 정답 출처가 포함된 평가셋 구축
- [ ] 답변 Faithfulness, Citation Correctness, Answer Relevance 평가
- [ ] 관련 질문·무관 질문·혼합 질문 Guardrail 평가셋 구축
- [ ] Hybrid 후보 수와 RRF k 재평가
- [ ] Reranker 도입 전후 성능과 latency 비교
- [ ] 실패 케이스별 Query Rewrite 또는 metadata filter 필요성 검토
- [ ] LangSmith Dataset 및 반복 실험 관리 검토

완료 기준:

- Retriever와 생성 모델의 실패 원인을 분리해서 측정할 수 있다.
- Reranker 등 추가 기능이 실제 개선을 만들었는지 수치로 판단할 수 있다.

### 7단계: OCR·지출 분석 및 운영 준비

목표: 설계 문서의 나머지 AI 기능과 배포·운영 요구사항을 구현한다.

- [ ] 영수증 이미지 형식과 용량 제한 확정
- [ ] OCR/Vision 모델을 통한 날짜, 상호, 금액, 품목 추출
- [ ] OCR 실패와 수동 입력 보완 구조 연결
- [ ] 지출 분류 결과 schema 확정
- [ ] 세법 RAG를 이용한 경비처리 가능성 및 근거 생성
- [ ] 구조화 로그, 오류 및 latency 지표 수집
- [ ] Docker Compose에서 Backend, LLM, Database, Frontend 통합 실행
- [ ] 동시 요청, timeout, 재시도 및 부하 테스트
- [ ] 운영 환경 비밀정보와 접근 권한 점검

완료 기준:

- 문서에 정의된 OCR·지출 분석 흐름이 Backend와 통합된다.
- 전체 서비스가 Docker 환경에서 실제 데이터로 안정적으로 동작한다.

## 5. 역할 구분 시 주의사항

- 세액감면 및 정책 지원 자격의 Rule 기반 판정은 Backend가 담당한다.
- LLM은 Backend 판정을 변경하지 않고 공식 문서 근거와 함께 설명한다.
- 사용자-facing API는 Backend가 제공하고 LLM API는 내부 서비스로 유지한다.
- Backend는 LLM이 반환한 답변과 출처를 DB에 저장한다.
- LLM은 운영 단계에서 Postgres + pgvector의 Vector 데이터에 직접 접근한다.

## 6. 현재 상태를 한 문장으로 표현

> 정책 RAG MVP와 Hybrid Search까지 구현됐으며, 다음 핵심 단계는 Backend·DB
> 계약 확정 후 PostgreSQL + pgvector 및 실제 사용자 데이터와 연동하는 것이다.
