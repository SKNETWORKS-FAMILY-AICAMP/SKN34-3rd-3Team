from pathlib import Path

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore

from src.data.contracts import RagChunk, VectorSearchResult


class InMemoryVectorSearch:
    """Process-local vector search used until PostgreSQL + pgvector is ready."""

    def __init__(self, embedding: Embeddings) -> None:
        self._store = InMemoryVectorStore(embedding=embedding)

    def add_chunks(self, chunks: list[RagChunk]) -> list[str]:
        """Embed and add chunks without modifying the supplied dictionaries."""
        documents = [self._to_document(chunk) for chunk in chunks]
        ids = [chunk["chunk_id"] for chunk in chunks]
        return self._store.add_documents(documents=documents, ids=ids)

    def save(self, path: Path) -> None:
        """Serialize the process-local store for later test runs."""
        self._store.dump(str(path))

    @classmethod
    def load(cls, path: Path, *, embedding: Embeddings) -> "InMemoryVectorSearch":
        """Restore vectors without embedding the source documents again."""
        instance = cls(embedding=embedding)
        instance._store = InMemoryVectorStore.load(str(path), embedding=embedding)
        return instance

    def search(
        self,
        query: str,
        *,
        policy_id: int | None = None,
        top_k: int = 5,
    ) -> list[VectorSearchResult]:
        if not query.strip():
            raise ValueError("query must not be blank")
        if top_k < 1:
            raise ValueError("top_k must be at least 1")

        document_filter = None
        if policy_id is not None:
            document_filter = lambda document: (
                document.metadata.get("policy_id") == policy_id
            )

        matches = self._store.similarity_search_with_score(
            query=query,
            k=top_k,
            filter=document_filter,
        )
        return [self._to_search_result(document, score) for document, score in matches]

    @staticmethod
    def _to_document(chunk: RagChunk) -> Document:
        return Document(
            id=chunk["chunk_id"],
            page_content=chunk["content"],
            metadata={
                "chunk_id": chunk["chunk_id"],
                "policy_id": chunk["policy_id"],
                "title": chunk["title"],
                "source": chunk["source"],
                "page": chunk["page"],
            },
        )

    @staticmethod
    def _to_search_result(document: Document, score: float) -> VectorSearchResult:
        metadata = document.metadata
        return {
            "chunk_id": str(metadata["chunk_id"]),
            "policy_id": int(metadata["policy_id"]),
            "title": str(metadata["title"]),
            "source": str(metadata["source"]),
            "page": int(metadata["page"]),
            "content": document.page_content,
            "score": float(score),
        }
