from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from langsmith import traceable

from src.data.contracts import UserProfile, VectorSearchResult
from src.rag.contracts import EligibilityDecision
from src.rag.prompts import (
    POLICY_DISCOVERY_PROMPT,
    RAG_PROMPT,
    format_decision_context,
    format_document_context,
)
from src.rag.query_builder import format_user_context


@traceable(name="generate_answer", run_type="chain")
async def generate_answer(
    llm: BaseChatModel,
    *,
    question: str,
    results: list[VectorSearchResult],
    decision: EligibilityDecision | None,
) -> str:
    chain = RAG_PROMPT | llm | StrOutputParser()
    return await chain.ainvoke(
        {
            "question": question,
            "document_context": format_document_context(results),
            "decision_context": format_decision_context(decision),
        },
        config={
            "run_name": "grounded_rag_generation",
            "tags": ["rag", "grounded-answer"],
            "metadata": {
                "policy_id": results[0]["policy_id"] if results else None,
                "source_count": len(results),
            },
        },
    )


@traceable(name="generate_policy_summary", run_type="chain")
async def generate_policy_summary(
    llm: BaseChatModel,
    *,
    question: str,
    user: UserProfile,
    results: list[VectorSearchResult],
) -> str:
    chain = POLICY_DISCOVERY_PROMPT | llm | StrOutputParser()
    return await chain.ainvoke(
        {
            "question": question,
            "user_context": format_user_context(user),
            "document_context": format_document_context(results),
        },
        config={
            "run_name": "personalized_policy_summary",
            "tags": ["rag", "policy-discovery", "personalized"],
            "metadata": {
                "source_count": len(results),
                "policy_count": len({result["policy_id"] for result in results}),
            },
        },
    )
