"""창업ON Backend (FastAPI).

실행:  cd Backend && uv run uvicorn main:app --reload --port 8000
문서:  http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core import db
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_pool()
    yield
    db.close_pool()


app = FastAPI(
    title="창업ON API",
    description="청년·1인 창업자 맞춤형 AI 행정·재정 지원 플랫폼 Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend 는 /api 프리픽스로 호출한다 (vite proxy → http://localhost:8000)
app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "db": db.healthy(), "llm": settings.LLM_BASE_URL}


def main():
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
