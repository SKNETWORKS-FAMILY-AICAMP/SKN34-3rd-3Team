# LLM/RAG Service

Backend가 확정한 정책·세액감면 판정 결과를 공식 문서 근거와 함께 설명하기
위한 내부 LLM 서비스다. 판정 자체는 Backend의 Rule 기반 로직을 Source of
Truth로 사용하며, 이 서비스는 판정값을 변경하지 않는다.

현재 단계에서는 다음 최소 실행 기반만 제공한다.

- FastAPI 애플리케이션과 `GET /health`
- 환경변수 기반 LLM·Embedding 모델 팩터리
- Backend/DB 응답을 흉내 내는 JSON 호환 Mock 데이터 계층
- 실제 자격증명 없이도 실행 가능한 지연 초기화

문서 ingestion, Chunking, Embedding 적재, Retriever, 답변 생성은 다음 단계에서
구현한다. `data/raw/`의 원본은 읽기 전용으로 취급하며 가공 결과를 원본에
덮어쓰지 않는다.

## 구조

```text
LLM/
├── main.py
├── src/
│   ├── core/
│   │   └── config.py       # 환경변수 설정
│   ├── data/
│   │   ├── contracts.py    # Backend/DB 데이터 타입 계약
│   │   └── mock_repository.py # 교체 가능한 Mock 접근 함수
│   ├── models/
│   │   └── factory.py      # 교체 가능한 모델 생성 진입점
│   └── serving/
│       ├── app.py          # FastAPI 애플리케이션
│       └── schemas.py      # API 응답 스키마
└── tests/
```

## 환경 설정

`.env.example`을 `.env`로 복사한 뒤 필요한 값을 입력한다. `.env`는 Git과
Docker build context에서 제외된다.

```dotenv
LLM_MODEL=YOUR_LLM_MODEL
EMBEDDING_MODEL=YOUR_EMBEDDING_MODEL
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
CORS_ORIGINS=http://localhost:5173
```

현재 모델 adapter는 OpenAI를 기본으로 사용한다. 모델 값이 비어 있거나 `YOUR_`
placeholder이면 미설정 상태로 처리하므로 Health API는 자격증명 없이도
정상 실행된다.

## Mock 데이터 사용

현재 단계에서는 실제 DB나 Backend API에 연결하지 않는다. LLM 로직에서는 Mock
상수에 직접 접근하지 않고 다음 함수만 사용한다.

```python
from src.data import get_eligibility_result, get_policy, get_user_profile

user = get_user_profile(user_id=1)
policy = get_policy(policy_id=101)
decision = get_eligibility_result(user_id=1, policy_id=101)
```

각 함수는 JSON으로 직렬화할 수 있는 Dictionary의 복사본을 반환한다. 향후 실제
Backend REST API를 사용할 때에는 이 접근 함수의 내부 구현만 교체하고 RAG 및
Prompt 코드는 동일한 반환 계약을 사용한다.

Mock 판정 결과는 Backend가 이미 계산해 전달한 값으로 간주한다. Mock 계층은
`eligible`이나 `reasons`를 계산하거나 변경하지 않는다.

## 로컬 실행

```bash
cd LLM
uv sync
uv run uvicorn main:app --reload
```

- Health Check: `http://localhost:8000/health`
- OpenAPI 문서: `http://localhost:8000/docs`

또는 다음 명령으로 `HOST`, `PORT`, `RELOAD` 설정을 사용해 실행할 수 있다.

```bash
uv run python main.py
```

## 테스트

```bash
cd LLM
uv run pytest
```

테스트는 외부 모델 API와 실제 DB에 접속하지 않는다.

## React 테스트 UI

`Frontend/`에는 React와 TailwindCSS로 만든 LLM 전용 임시 상태 확인 화면이 있다.
최종 서비스 아키텍처에서는 Frontend가 Backend만 호출하지만, 이 화면은 개발 중
LLM 서비스의 `/health`를 직접 확인하기 위한 도구다.

```bash
cd Frontend
npm install
npm run dev
```

기본 LLM API 주소는 `http://localhost:8000`이며 `Frontend/.env`의
`VITE_LLM_API_URL`로 변경할 수 있다.

## Docker

저장소 루트 Compose에는 `llm` 서비스가 이미 등록되어 있지만 포트와 환경변수
전달은 아직 정의되어 있지 않다. 다른 담당 영역인 루트 Compose를 수정하지
않았으므로, Docker를 통한 호스트 접근과 실제 연동 전 해당 설정을 팀에서
추가해야 한다.
