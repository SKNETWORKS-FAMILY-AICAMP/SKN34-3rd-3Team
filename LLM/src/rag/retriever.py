from langsmith import traceable

from src.data.contracts import VectorSearchResult
from src.rag.guardrails import keep_grounded_results
from src.vectorstores.base import VectorSearch


class RagRetriever:
    def __init__(self, vector_search: VectorSearch, *, min_score: float) -> None:
        self._vector_search = vector_search
        self._min_score = min_score

    @traceable(name="retrieve_documents", run_type="retriever")
    def retrieve(
        self,
        question: str,
        *,
        policy_id: int | None,
        top_k: int,
    ) -> list[VectorSearchResult]:
        results = self._vector_search.search(
            question,
            policy_id=policy_id,
            top_k=top_k,
        )
        return keep_grounded_results(
            results,
            policy_id=policy_id,
            min_score=self._min_score,
        )
