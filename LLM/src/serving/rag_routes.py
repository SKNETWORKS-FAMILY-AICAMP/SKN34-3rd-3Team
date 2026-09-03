from functools import partial
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from starlette.concurrency import run_in_threadpool

from src.core.config import Settings, get_settings
from src.core.langsmith import LangSmithConfigurationError
from src.data import MockDataNotFoundError, get_document_catalog, get_user_profile
from src.features.index_cache import load_or_build_document_index
from src.features.pdf_loader import PdfDocumentError
from src.models import ModelConfigurationError
from src.rag.contracts import EligibilityDecision
from src.rag.discovery import PolicyDiscoveryService
from src.rag.guardrails import RagInputError
from src.rag.runtime import RagIndexNotReadyError, RagRuntime
from src.rag.service import RagService
from src.serving.schemas import (
    EligibilityDecisionRequest,
    IndexRequest,
    IndexResponse,
    MatchedPolicyResponse,
    PolicyRecommendationRequest,
    PolicyRecommendationResponse,
    RagAnswerRequest,
    RagAnswerResponse,
    ReadyResponse,
    SourceResponse,
)


router = APIRouter(prefix="/internal/rag", tags=["internal-rag"])


def get_runtime(request: Request) -> RagRuntime:
    return request.app.state.rag_runtime


@router.get("/ready", response_model=ReadyResponse)
async def ready(
    runtime: RagRuntime = Depends(get_runtime),
    settings: Settings = Depends(get_settings),
) -> ReadyResponse:
    return ReadyResponse(
        status="ready" if runtime.ready else "not_ready",
        index_ready=runtime.ready,
        llm_configured=settings.llm_configured,
        embedding_configured=settings.embedding_configured,
        langsmith_tracing=settings.langsmith_configured,
        document_count=runtime.document_count,
        chunk_count=runtime.chunk_count,
        index_source=runtime.index_source,
    )


@router.post("/index", response_model=IndexResponse)
async def create_index(
    payload: IndexRequest | None = None,
    runtime: RagRuntime = Depends(get_runtime),
    settings: Settings = Depends(get_settings),
) -> IndexResponse:
    force = payload.force if payload is not None else False
    if runtime.ready and not force:
        return _index_response(runtime, "already_ready")

    async with runtime.index_lock:
        if runtime.ready and not force:
            return _index_response(runtime, "already_ready")

        try:
            catalog = get_document_catalog()
            embedding = runtime.embedding_factory()
            cached_index = await run_in_threadpool(
                partial(
                    load_or_build_document_index,
                    embedding=embedding,
                    settings=settings,
                    catalog=catalog,
                    force=force,
                )
            )
            runtime.set_index(
                cached_index.vector_search,
                document_count=cached_index.document_count,
                chunk_count=cached_index.chunk_count,
                index_source=(
                    "cache" if cached_index.loaded_from_cache else "embedding"
                ),
            )
        except ModelConfigurationError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except (FileNotFoundError, PdfDocumentError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Document embedding failed.",
            ) from exc

    return _index_response(runtime, "ready")


@router.post("/answer", response_model=RagAnswerResponse)
async def answer(
    payload: RagAnswerRequest,
    runtime: RagRuntime = Depends(get_runtime),
    settings: Settings = Depends(get_settings),
) -> RagAnswerResponse:
    try:
        vector_search = runtime.require_index()
        rag_service = RagService(
            vector_search=vector_search,
            llm_factory=runtime.llm_factory,
            settings=settings,
        )
        decision = _to_domain_decision(payload.decision)
        result = await rag_service.answer(
            payload.question,
            policy_id=payload.policy_id,
            top_k=payload.top_k,
            decision=decision,
        )
        return RagAnswerResponse(
            answer=result.answer,
            grounded=result.grounded,
            sources=[
                SourceResponse(
                    chunk_id=source.chunk_id,
                    policy_id=source.policy_id,
                    title=source.title,
                    source=source.source,
                    page=source.page,
                    excerpt=source.excerpt,
                    score=source.score,
                )
                for source in result.sources
            ],
            decision=(
                EligibilityDecisionRequest(
                    eligible=result.decision.eligible,
                    reasons=list(result.decision.reasons),
                )
                if result.decision is not None
                else None
            ),
        )
    except RagIndexNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except (ModelConfigurationError, LangSmithConfigurationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except RagInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="RAG answer generation failed.",
        ) from exc


def _to_domain_decision(
    decision: EligibilityDecisionRequest | None,
) -> EligibilityDecision | None:
    if decision is None:
        return None
    return EligibilityDecision(
        eligible=decision.eligible,
        reasons=tuple(decision.reasons),
    )


def _index_response(
    runtime: RagRuntime,
    response_status: Literal["ready", "already_ready"],
) -> IndexResponse:
    return IndexResponse(
        status=response_status,
        source=runtime.index_source or "embedding",
        document_count=runtime.document_count,
        chunk_count=runtime.chunk_count,
    )


@router.post("/recommendations", response_model=PolicyRecommendationResponse)
async def recommend_policies(
    payload: PolicyRecommendationRequest,
    runtime: RagRuntime = Depends(get_runtime),
    settings: Settings = Depends(get_settings),
) -> PolicyRecommendationResponse:
    try:
        vector_search = runtime.require_index()
        user = get_user_profile(payload.user_id)
        service = PolicyDiscoveryService(
            vector_search=vector_search,
            llm_factory=runtime.llm_factory,
            settings=settings,
        )
        result = await service.discover(
            payload.question,
            user=user,
            top_k=payload.top_k,
        )
        return PolicyRecommendationResponse(
            user_id=result.user_id,
            answer=result.answer,
            grounded=result.grounded,
            policies=[
                MatchedPolicyResponse(
                    policy_id=policy.policy_id,
                    title=policy.title,
                    sources=[
                        SourceResponse(
                            chunk_id=source.chunk_id,
                            policy_id=source.policy_id,
                            title=source.title,
                            source=source.source,
                            page=source.page,
                            excerpt=source.excerpt,
                            score=source.score,
                        )
                        for source in policy.sources
                    ],
                )
                for policy in result.policies
            ],
        )
    except RagIndexNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except MockDataNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except (ModelConfigurationError, LangSmithConfigurationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except RagInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Policy recommendation generation failed.",
        ) from exc
