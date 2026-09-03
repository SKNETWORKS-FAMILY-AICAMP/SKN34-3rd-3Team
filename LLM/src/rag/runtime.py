import asyncio
from collections.abc import Callable
from typing import Literal

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

from src.models import get_embedding_model, get_llm
from src.vectorstores.base import VectorSearch


class RagIndexNotReadyError(RuntimeError):
    """Raised when an answer is requested before process-local indexing."""


class RagRuntime:
    """Own process-local RAG state without triggering model calls on creation."""

    def __init__(
        self,
        *,
        embedding_factory: Callable[[], Embeddings] = get_embedding_model,
        llm_factory: Callable[[], BaseChatModel] = get_llm,
    ) -> None:
        self.embedding_factory = embedding_factory
        self.llm_factory = llm_factory
        self.index_lock = asyncio.Lock()
        self._vector_search: VectorSearch | None = None
        self.document_count = 0
        self.chunk_count = 0
        self.index_source: Literal["cache", "embedding"] | None = None

    @property
    def ready(self) -> bool:
        return self._vector_search is not None

    def set_index(
        self,
        vector_search: VectorSearch,
        *,
        document_count: int,
        chunk_count: int,
        index_source: Literal["cache", "embedding"],
    ) -> None:
        self._vector_search = vector_search
        self.document_count = document_count
        self.chunk_count = chunk_count
        self.index_source = index_source

    def require_index(self) -> VectorSearch:
        if self._vector_search is None:
            raise RagIndexNotReadyError(
                "RAG index is not ready. Call POST /internal/rag/index first."
            )
        return self._vector_search
