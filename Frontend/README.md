# LLM Test UI

LLM/RAG 기능을 독립적으로 확인하기 위한 임시 개발 화면이다. 프로젝트 기술
스택에 맞춰 React와 TailwindCSS로 구성했다.

현재는 LLM FastAPI 서비스의 `GET /health`를 호출해 다음 상태를 표시한다.

- LLM API 실행 여부
- LLM 모델 설정 여부
- Embedding 모델 설정 여부
- 현재 데이터 계층이 Mock인지 여부

질문과 RAG 답변 영역은 실제 Retriever 및 답변 API가 구현된 뒤 활성화한다.
가짜 응답은 반환하지 않는다.

## 실행

LLM API를 먼저 실행한 다음 테스트 UI를 실행한다.

```bash
npm install
npm run dev
```

기본 접속 주소는 `http://localhost:5173`이다. LLM API 주소를 변경하려면
`.env.example`을 `.env`로 복사하고 `VITE_LLM_API_URL`을 설정한다.

이 화면은 개발 중에만 LLM을 직접 호출한다. 최종 서비스에서는 설계 문서에
따라 Frontend가 Backend REST API를 호출해야 한다.
