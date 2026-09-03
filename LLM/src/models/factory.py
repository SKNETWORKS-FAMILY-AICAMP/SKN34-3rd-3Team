from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from src.core.config import Settings, get_settings
from langchain_openai import OpenAIEmbeddings


class ModelConfigurationError(RuntimeError):
    """Raised when a model name or OpenAI credential is missing."""


def get_llm(settings: Settings | None = None) -> BaseChatModel:
    """환경 변수로 지정된 LLM모델을 호출하는 함수"""
    resolved = settings or get_settings()
    if not resolved.llm_configured:
        raise ModelConfigurationError(
            "LLM is not configured. Set LLM_MODEL and OPENAI_API_KEY in LLM/.env."
        )

    return ChatOpenAI(
        model=resolved.llm_model,
        api_key=resolved.openai_api_key,
        temperature=0,
    )


def get_embedding_model(settings: Settings | None = None) -> Embeddings:
    """환경 변수로 지정된 임베딩 모델을 호출하는 함수."""
    resolved = settings or get_settings()
    if not resolved.embedding_configured:
        raise ModelConfigurationError(
            "Embedding model is not configured. Set EMBEDDING_MODEL and "
            "OPENAI_API_KEY in LLM/.env."
        )
    return OpenAIEmbeddings(
        model=resolved.embedding_model,
        api_key=resolved.openai_api_key,
    )
