from typing import Protocol

from src.data.contracts import RagChunk, VectorSearchResult


class VectorSearch(Protocol):
    """Minimal contract shared by the test store and a future pgvector store."""

    def add_chunks(self, chunks: list[RagChunk]) -> list[str]: ...

    def search(
        self,
        query: str,
        *,
        policy_id: int | None = None,
        top_k: int = 5,
    ) -> list[VectorSearchResult]: ...
