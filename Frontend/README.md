# LLM Test UI

LLM/RAG 기능을 독립적으로 확인하기 위한 임시 개발 화면이다. 프로젝트 기술
스택에 맞춰 React와 TailwindCSS로 구성했다.

LLM FastAPI 서비스의 상태 확인과 Backend 어댑터 API 테스트를 제공한다.

- **Backend E2E:** 데모 로그인 후 `Frontend → Backend /chat/messages → LLM` 전체 흐름
- **LLM 직접 호출:** `/rag/chat` 요청과 Graph route/status를 독립 검증

- LLM API 실행 여부
- LLM 모델 설정 여부
- Embedding 모델 설정 여부
- In-memory Vector Store 사용 여부
- PDF RAG 인덱스 생성
- `POST /rag/chat`의 category, question, userContext 전달
- Policy / Notice / Tax LangGraph route와 최종 status 표시
- Backend가 조회했다고 가정한 Notice JSON 전달 및 boundary 검증
- grounded 상태와 Backend 형식의 title, url, excerpt 출처 표시

인덱스 생성 버튼은 먼저 로컬 캐시를 확인한다. 캐시가 유효하면 문서 Embedding을
다시 하지 않고, 캐시가 없거나 원본·설정이 변경됐을 때만 OpenAI Embedding API가
호출된다. 질문 전송 시에는 Query Embedding과 LLM API가 호출된다. API Key는
Frontend에 저장하거나 전달하지 않는다.

## 실행

LLM API를 8001 포트로 먼저 실행한 다음 테스트 UI를 실행한다.

```bash
npm install
npm run dev
```

저장소 루트에서 실행할 경우:

```powershell
cd LLM
uv run python main.py

# 별도 터미널
cd Frontend
npm install
npm run dev
```

기본 접속 주소는 `http://localhost:5173`이다. LLM API 주소를 변경하려면
`.env.example`을 `.env`로 복사하고 `VITE_LLM_API_URL`을 설정한다. 기본값은
`http://localhost:8001`이다.

Backend E2E 기본 주소는 `http://localhost:8000`이며
`VITE_BACKEND_API_URL`로 변경할 수 있다. 화면의 기본 데모 계정은 Backend README의
로컬 테스트 계정이다.

Policy와 Tax는 RAG 인덱스가 필요하다. `인덱스 준비`는 변경된 Chunk만 임베딩하고,
`전체 재임베딩`은 모든 문서를 다시 처리하므로 OpenAI 비용이 발생한다. Notice는
인덱스 없이도 테스트할 수 있다. Notice JSON을 비우면 `integration_unavailable`,
`[]`를 입력하면 `no_result`, 실제 배열을 입력하면 Backend 결과 전달 흐름을 확인한다.

이 화면은 개발 중에만 LLM을 직접 호출한다. 최종 서비스에서는 설계 문서에
따라 Frontend가 Backend REST API를 호출해야 한다.
