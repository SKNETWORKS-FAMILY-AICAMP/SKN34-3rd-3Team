from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.rag.runtime import RagRuntime
from src.serving.rag_routes import router as rag_router
from src.serving.schemas import ComponentConfiguration, HealthResponse


APP_VERSION = "0.1.0"


def create_app(runtime: RagRuntime | None = None) -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=APP_VERSION,
        description="Internal LLM and RAG service for grounded explanations.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    application.state.rag_runtime = runtime or RagRuntime()
    application.include_router(rag_router)

    @application.get(
        "/health",
        response_model=HealthResponse,
        tags=["system"],
        summary="Check whether the LLM API process is running",
    )
    async def health() -> HealthResponse:
        return HealthResponse(
            service=settings.app_name,
            version=APP_VERSION,
            components=ComponentConfiguration(
                llm="configured" if settings.llm_configured else "not_configured",
                embedding=(
                    "configured"
                    if settings.embedding_configured
                    else "not_configured"
                ),
                data_source="in_memory",
            ),
        )

    return application


app = create_app()
