import asyncio

import pytest

from src.core.config import Settings
from src.data.contracts import VectorSearchResult
from src.rag.graph import RouteDecision, build_graph
from src.rag.answer import UnifiedAnswerResult
from src.rag.tax import (
    TaxCalculationError,
    TaxCalculationInputPlan,
    TaxCalculationPlan,
    TaxEvidenceDecision,
    TaxIntentDecision,
    TaxNextQuery,
    calculate_tax_plan,
    classify_tax_intent,
    evaluate_tax_evidence,
    generate_tax_calculation_inputs,
    generate_tax_calculation_plan,
    generate_tax_next_query,
)
from src.serving.tax_calculators_docstring import calculate_tax as serving_calculate_tax
from tests.fakes import FakeStructuredChatModel


def _tax_document(chunk_id: str, content: str) -> VectorSearchResult:
    return {
        "chunk_id": chunk_id,
        "policy_id": None,
        "title": "조세특례제한법",
        "source": f"db://tax_documents/{chunk_id}",
        "page": 1,
        "content": content,
        "score": 0.8,
    }


class SequentialTaxSearch:
    def __init__(self, results: list[list[VectorSearchResult]]) -> None:
        self.results = results
        self.call_count = 0

    def search_stages(
        self,
        _query: str,
        *,
        policy_id: int | None,
        top_k: int,
    ) -> tuple[
        list[VectorSearchResult],
        list[VectorSearchResult],
        list[VectorSearchResult],
    ]:
        index = min(self.call_count, len(self.results) - 1)
        self.call_count += 1
        result = self.results[index][:top_k]
        return result, result, result


def _router_llm(
    *,
    calculation_required: bool = False,
    calculation_type: str | None = None,
    cited_source_numbers: list[int] | None = None,
) -> FakeStructuredChatModel:
    return FakeStructuredChatModel(
        {
            RouteDecision: {"route": "tax", "personalized": False},
            TaxIntentDecision: {
                "calculation_required": calculation_required,
                "calculation_type": calculation_type,
                "reason": "test",
            },
            UnifiedAnswerResult: {
                "answer": "누적 법령 근거 기반 답변",
                "status": "success",
                "cited_source_numbers": (
                    [1] if cited_source_numbers is None else cited_source_numbers
                ),
            },
        }
    )


def _identity_rerank(
    _query: str,
    documents: list[VectorSearchResult],
    top_n: int,
) -> list[VectorSearchResult]:
    return documents[:top_n]


def _decision(
    *,
    sufficient: bool,
    missing_information: list[str] | None = None,
    missing_user_context: list[str] | None = None,
    calculation_required: bool = False,
    resolved_calculation_inputs: dict[str, object] | None = None,
    cited_source_numbers: list[int] | None = None,
) -> TaxEvidenceDecision:
    resolved = resolved_calculation_inputs or {}
    return TaxEvidenceDecision(
        sufficient=sufficient,
        missing_information=missing_information or [],
        missing_user_context=missing_user_context or [],
        calculation_required=calculation_required,
        resolved_category=resolved.get("category"),  # type: ignore[arg-type]
        resolved_region=resolved.get("region"),  # type: ignore[arg-type]
        resolved_rate_percent=(
            str(resolved["rate_percent"])
            if resolved.get("rate_percent") is not None
            else None
        ),
        cited_source_numbers=cited_source_numbers or [],
        reason="test",
    )


def _input_plan_payload(
    calculation_inputs: dict[str, object],
    *,
    missing_required_inputs: list[str] | None = None,
    reason: str = "test",
) -> dict[str, object]:
    payload: dict[str, object] = {
        key: None
        for key in (
            "tax_base_krw",
            "tax_year",
            "monthly_salary_krw",
            "family_count",
            "child_count",
            "taxable_sales_supply_value_krw",
            "deductible_input_tax_krw",
            "tax_credit_krw",
            "prepaid_tax_krw",
            "penalty_tax_krw",
            "sales_amount_krw",
            "industry",
            "eligible_tax_krw",
            "startup_year",
            "age",
            "business_location",
            "first_startup",
            "base_amount",
        )
    }
    payload.update(calculation_inputs)
    for key in {
        "tax_base_krw",
        "monthly_salary_krw",
        "taxable_sales_supply_value_krw",
        "deductible_input_tax_krw",
        "tax_credit_krw",
        "prepaid_tax_krw",
        "penalty_tax_krw",
        "sales_amount_krw",
        "eligible_tax_krw",
        "base_amount",
    }:
        if payload[key] is not None:
            payload[key] = str(payload[key])
    payload["missing_required_inputs"] = missing_required_inputs or []
    payload["reason"] = reason
    return payload


def _input_plan(
    calculation_inputs: dict[str, object],
    *,
    missing_required_inputs: list[str] | None = None,
    reason: str = "test",
) -> TaxCalculationInputPlan:
    return TaxCalculationInputPlan.model_validate(
        _input_plan_payload(
            calculation_inputs,
            missing_required_inputs=missing_required_inputs,
            reason=reason,
        )
    )


def test_tax_single_hop_stops_when_evidence_is_sufficient() -> None:
    search = SequentialTaxSearch(
        [[_tax_document("tax-1", "청년창업 세액감면 요건")]]
    )

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=True)

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            settings=Settings(_env_file=None),
        ).ainvoke({"query": "청년창업 세액감면이 뭐야?"})
    )

    assert search.call_count == 1
    assert result["evidence_sufficient"] is True
    assert result["hop_count"] == 1
    assert result["termination_reason"] == "evidence_sufficient"
    assert result["answer_status"] == "success"
    assert result["answer"] == "누적 법령 근거 기반 답변"
    assert result["answer_sources"][0]["chunk_id"] == "tax-1"


def test_tax_multi_hop_accumulates_new_evidence() -> None:
    search = SequentialTaxSearch(
        [
            [_tax_document("tax-1", "감면 대상 업종 확인 필요")],
            [_tax_document("tax-2", "음식점업의 감면 적용 요건")],
        ]
    )
    decisions = iter(
        [
            _decision(sufficient=False, missing_information=["업종 요건"]),
            _decision(sufficient=True),
        ]
    )

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return next(decisions)

    async def next_query(_state: object) -> TaxNextQuery:
        return TaxNextQuery(
            query="청년창업 세액감면 음식점업 요건",
            reason="업종 요건 필요",
        )

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_next_query_generator=next_query,  # type: ignore[arg-type]
            settings=Settings(_env_file=None, tax_max_hops=3),
        ).ainvoke({"query": "27살 서울 음식점 창업 세액감면 대상이야?"})
    )

    assert result["hop_count"] == 2
    assert result["search_history"] == [
        "27살 서울 음식점 창업 세액감면 대상이야?",
        "청년창업 세액감면 음식점업 요건",
    ]
    assert [doc["chunk_id"] for doc in result["reranked_docs"]] == [
        "tax-1",
        "tax-2",
    ]


def test_explicit_reference_has_priority_over_next_query_generator() -> None:
    search = SequentialTaxSearch(
        [
            [_tax_document("tax-1", "조세특례제한법 제6조에 따른 감면")],
            [_tax_document("tax-2", "조세특례제한법 제6조 세부 요건")],
        ]
    )
    decisions = iter([_decision(sufficient=False), _decision(sufficient=True)])
    next_query_calls = 0

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return next(decisions)

    async def next_query(_state: object) -> TaxNextQuery:
        nonlocal next_query_calls
        next_query_calls += 1
        return TaxNextQuery(query="사용되면 안 됨", reason="test")

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_next_query_generator=next_query,  # type: ignore[arg-type]
        ).ainvoke({"query": "세액감면 근거 알려줘"})
    )

    assert next_query_calls == 0
    assert result["search_history"][1] == "조세특례제한법 제6조"


def test_duplicate_query_stops_loop() -> None:
    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=False)

    async def duplicate_query(_state: object) -> TaxNextQuery:
        return TaxNextQuery(query="세액감면 요건", reason="test")

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "추가 확인 필요")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_next_query_generator=duplicate_query,  # type: ignore[arg-type]
        ).ainvoke({"query": "세액감면 요건"})
    )

    assert result["hop_count"] == 1
    assert result["termination_reason"] == "duplicate_query"
    assert result["evidence_sufficient"] is False


def test_max_hops_keeps_insufficient_evidence_state() -> None:
    search = SequentialTaxSearch(
        [
            [_tax_document("tax-1", "첫 근거")],
            [_tax_document("tax-2", "두 번째 근거")],
        ]
    )
    next_queries = iter(["두 번째 검색", "세 번째 검색"])

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=False, missing_information=["추가 근거"])

    async def next_query(_state: object) -> TaxNextQuery:
        return TaxNextQuery(query=next(next_queries), reason="test")

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_next_query_generator=next_query,  # type: ignore[arg-type]
            settings=Settings(_env_file=None, tax_max_hops=2),
        ).ainvoke({"query": "세금 첫 검색"})
    )

    assert result["hop_count"] == 2
    assert result["termination_reason"] == "max_hops"
    assert result["evidence_sufficient"] is False
    assert result["answer_status"] == "insufficient_evidence"


def test_missing_user_context_stops_retrieval() -> None:
    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(
            sufficient=True,
            missing_user_context=["창업일"],
        )

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "법령 근거 충분")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
        ).ainvoke({"query": "내가 감면 대상이야?"})
    )

    assert result["hop_count"] == 1
    assert result["termination_reason"] == "missing_user_context"
    assert "창업일" in result["answer"]


def test_withholding_uses_disclosed_defaults_for_missing_family_values() -> None:
    search = SequentialTaxSearch([[_tax_document("tax-1", "사용되면 안 됨")]])

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={"monthly_salary_krw": 3_200_000},
            missing_required_inputs=["공제대상 가족 수"],
            reason="가족 수 필요",
        )

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="withholding_tax",
                cited_source_numbers=[],
            ),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_calculation_planner=plan,  # type: ignore[arg-type]
        ).ainvoke({"query": "월급 320만원인데 소득세 얼마야?"})
    )

    assert search.call_count == 0
    assert result["calculation_result"]["withholding_income_tax_krw"] == "91460.00"
    assert result["calculation_result"]["calculation_method"] == "formula_reproduction"
    assert result["termination_reason"] == "calculation_complete"
    assert result["answer_status"] == "success"
    assert result["calculation_inputs"]["family_count"] == 1
    assert result["calculation_inputs"]["child_count"] == 0
    assert len(result["calculation_assumptions"]) == 2


def test_direct_income_tax_skips_retrieval_and_calls_calculator_once() -> None:
    search = SequentialTaxSearch([[_tax_document("tax-1", "사용되면 안 됨")]])
    calls = {"intent": 0, "planner": 0, "calculator": 0}

    async def intent(_state: object) -> TaxIntentDecision:
        calls["intent"] += 1
        return TaxIntentDecision(
            calculation_required=True,
            calculation_type="income_tax",
            reason="산출세액 계산 요청",
        )

    async def plan(_state: object) -> TaxCalculationInputPlan:
        calls["planner"] += 1
        return _input_plan(
            calculation_inputs={"tax_base_krw": "5천만원", "tax_year": 2025},
            reason="질문에 명시됨",
        )

    def calculator(calculation_type: str, **kwargs: object) -> dict[str, object]:
        calls["calculator"] += 1
        assert calculation_type == "income_tax"
        assert kwargs == {"tax_base_krw": "50000000", "tax_year": 2025}
        return serving_calculate_tax(calculation_type, **kwargs)  # type: ignore[arg-type]

    result = asyncio.run(
        build_graph(
            _router_llm(cited_source_numbers=[]),
            tax_search=search,  # type: ignore[arg-type]
            tax_intent_classifier=intent,  # type: ignore[arg-type]
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "2025년 과세표준 5천만원 산출세액 얼마야?"})
    )

    assert calls == {"intent": 1, "planner": 1, "calculator": 1}
    assert search.call_count == 0
    assert result["answer_status"] == "success"
    assert result["calculation_inputs"]["tax_base_krw"] == "50000000"
    assert result["calculation_result"]["calculated_income_tax_krw"] == "6240000.00"


def test_direct_withholding_calls_formula_calculator_without_table_data() -> None:
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={
                "monthly_salary_krw": 3_200_000,
                "family_count": 1,
            },
            reason="질문에 명시됨",
        )

    def calculator(calculation_type: str, **kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        assert calculation_type == "withholding_tax"
        assert kwargs == {
            "monthly_salary_krw": "3200000",
            "family_count": 1,
            "child_count": 0,
        }
        return {"calculation_type": calculation_type, "tax": "50000.00"}

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="withholding_tax",
                cited_source_numbers=[],
            ),
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "월급 320만원, 가족 1명 원천징수세액은?"})
    )

    assert calculator_calls == 1
    assert result["answer_status"] == "success"


def test_withholding_without_external_table_runs_formula_calculator() -> None:
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={
                "monthly_salary_krw": 3_200_000,
                "family_count": 1,
            },
            reason="질문에 명시됨",
        )

    def calculator(calculation_type: str, **kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        return serving_calculate_tax(calculation_type, **kwargs)  # type: ignore[arg-type]

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="withholding_tax",
                cited_source_numbers=[],
            ),
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "월급 320만원, 가족 1명 원천징수세액은?"})
    )

    assert calculator_calls == 1
    assert result["termination_reason"] == "calculation_complete"
    assert result["missing_calculation_inputs"] == []
    assert result["answer_status"] == "success"
    assert result["calculation_result"]["withholding_income_tax_krw"] == "91460.00"


def test_startup_calculation_requires_rag_and_resolved_legal_inputs() -> None:
    search = SequentialTaxSearch(
        [[_tax_document("tax-1", "청년창업 비수도권 감면 요건")]]
    )
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={
                "eligible_tax_krw": 3_000_000,
                "startup_year": 2026,
                "age": 29,
                "business_location": "대전",
                "industry": "음식점업",
                "first_startup": True,
            },
            reason="사용자가 제공한 현실 정보",
        )

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(
            sufficient=True,
            calculation_required=True,
            resolved_calculation_inputs={
                "category": "youth_or_livelihood",
                "region": "outside_capital_region",
            },
            cited_source_numbers=[1],
        )

    def calculator(calculation_type: str, **kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        assert calculation_type == "startup_tax_reduction"
        assert kwargs["category"] == "youth_or_livelihood"
        assert kwargs["region"] == "outside_capital_region"
        assert "business_location" not in kwargs
        return {"calculation_type": calculation_type, "reduction": "3000000.00"}

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="startup_tax_reduction",
            ),
            tax_search=search,  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "29세 대전 음식점 첫 창업, 세금 300만원 감면액은?"})
    )

    assert search.call_count == 1
    assert calculator_calls == 1
    assert result["answer_status"] == "success"


def test_startup_unresolved_internal_parameter_blocks_calculator() -> None:
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={
                "eligible_tax_krw": 3_000_000,
                "startup_year": 2026,
                "age": 29,
                "business_location": "대전",
                "industry": "음식점업",
                "first_startup": True,
            },
            reason="사용자 현실 정보가 명시됨",
        )

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=True, calculation_required=True)

    def calculator(_calculation_type: str, **_kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        return {}

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="startup_tax_reduction",
            ),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "창업 감면 법령 일부")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "2026년 창업, 세금 300만원 감면액은?"})
    )

    assert calculator_calls == 0
    assert result["termination_reason"] == "calculation_parameter_unresolved"
    assert result["answer_status"] == "insufficient_evidence"


def test_legal_calculation_max_hops_never_calls_calculator() -> None:
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={
                "eligible_tax_krw": 3_000_000,
                "startup_year": 2026,
                "age": 29,
                "business_location": "대전",
                "industry": "음식점업",
                "first_startup": True,
            },
            reason="사용자 현실 정보가 명시됨",
        )

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(
            sufficient=False,
            missing_information=["적용 업종 근거"],
            calculation_required=True,
        )

    def calculator(_calculation_type: str, **_kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        return {}

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="startup_tax_reduction",
            ),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "불충분한 창업 감면 근거")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
            settings=Settings(_env_file=None, tax_max_hops=1),
        ).ainvoke({"query": "2026년 청년창업 세금 300만원 감면액은?"})
    )

    assert calculator_calls == 0
    assert result["termination_reason"] == "max_hops"
    assert result["answer_status"] == "insufficient_evidence"


def test_unsupported_income_tax_year_does_not_fallback_or_call_calculator() -> None:
    calculator_calls = 0

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={"tax_base_krw": 50_000_000, "tax_year": 2026},
            reason="질문에 명시됨",
        )

    def calculator(_calculation_type: str, **_kwargs: object) -> dict[str, object]:
        nonlocal calculator_calls
        calculator_calls += 1
        return {}

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="income_tax",
            ),
            tax_calculation_planner=plan,  # type: ignore[arg-type]
            tax_calculator=calculator,
        ).ainvoke({"query": "2026년 과세표준 5천만원 산출세액은?"})
    )

    assert calculator_calls == 0
    assert result["termination_reason"] == "unsupported_tax_year"
    assert result["answer_status"] == "integration_unavailable"


def test_evidence_based_decimal_calculation_reaches_unified_answer() -> None:
    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(
            sufficient=True,
            calculation_required=True,
            resolved_calculation_inputs={"rate_percent": "75"},
            cited_source_numbers=[1],
        )

    async def plan(_state: object) -> TaxCalculationInputPlan:
        return _input_plan(
            calculation_inputs={"base_amount": "1000000"},
            reason="명시된 기준 금액",
        )

    result = asyncio.run(
        build_graph(
            _router_llm(
                calculation_required=True,
                calculation_type="reduction_amount",
            ),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "산출세액의 100분의 75 감면")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_calculation_planner=plan,  # type: ignore[arg-type]
        ).ainvoke({"query": "예상 세금은 얼마야?"})
    )

    assert result["calculation_result"] == {
        "calculation_type": "reduction_amount",
        "base_amount": "1000000",
        "rate_percent": "75",
        "reduction_amount": "750000",
        "formula": "base_amount × rate_percent ÷ 100",
        "cited_source_numbers": [1],
    }
    assert result["termination_reason"] == "calculation_complete"
    assert result["answer_status"] == "success"
    assert result["normalized_ratios"][0]["percent"] == 75
    assert result["normalized_ratios"][0]["decimal"] == 0.75
    assert result["reranked_docs"][0]["content"] == "산출세액의 100분의 75 감면"


def test_tax_cohere_failure_falls_back_to_rrf() -> None:
    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=True)

    def failing_rerank(
        _query: str,
        _documents: list[VectorSearchResult],
        _top_n: int,
    ) -> list[VectorSearchResult]:
        from src.rag.reranker import CohereRerankError

        raise CohereRerankError("temporary error")

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "충분한 세법 근거")]]
            ),  # type: ignore[arg-type]
            rerank=failing_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
        ).ainvoke({"query": "세액감면이 뭐야?"})
    )

    assert result["reranked_docs"][0]["chunk_id"] == "tax-1"
    assert result["answer_status"] == "success"


def test_tax_no_result_reaches_unified_answer() -> None:
    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=SequentialTaxSearch([[]]),  # type: ignore[arg-type]
            rerank=_identity_rerank,
        ).ainvoke({"query": "찾을 수 없는 세법 질문"})
    )

    assert result["reranked_docs"] == []
    assert result["evidence_sufficient"] is False
    assert result["answer_status"] == "no_result"


def test_next_query_failure_goes_to_answer_without_calculation() -> None:
    calculation_calls = 0

    async def evaluate(_state: object) -> TaxEvidenceDecision:
        return _decision(sufficient=False, missing_information=["추가 법령"])

    async def failing_next_query(_state: object) -> TaxNextQuery:
        raise RuntimeError("generation failed")

    async def calculation_plan(_state: object) -> TaxCalculationPlan:
        nonlocal calculation_calls
        calculation_calls += 1
        raise AssertionError("calculation must not run")

    result = asyncio.run(
        build_graph(
            _router_llm(),
            tax_search=SequentialTaxSearch(
                [[_tax_document("tax-1", "추가 근거가 필요하다")]]
            ),  # type: ignore[arg-type]
            rerank=_identity_rerank,
            tax_evidence_evaluator=evaluate,  # type: ignore[arg-type]
            tax_next_query_generator=failing_next_query,  # type: ignore[arg-type]
            tax_calculation_planner=calculation_plan,  # type: ignore[arg-type]
        ).ainvoke({"query": "세액감면 조건 알려줘"})
    )

    assert calculation_calls == 0
    assert result["termination_reason"] == "next_query_error"
    assert result["answer_status"] == "error"


def test_tax_decisions_use_structured_output() -> None:
    model = FakeStructuredChatModel(
        {
            TaxEvidenceDecision: {
                "sufficient": False,
                "missing_information": ["업종 요건"],
                "missing_user_context": [],
                "calculation_required": False,
                "resolved_category": None,
                "resolved_region": None,
                "resolved_rate_percent": None,
                "cited_source_numbers": [],
                "reason": "추가 법령 필요",
            },
            TaxNextQuery: {
                "query": "조세특례제한법 음식점업 요건",
                "target_law": "조세특례제한법",
                "target_article": None,
                "reason": "업종 요건 검색",
            },
        }
    )
    documents = [_tax_document("tax-1", "감면 대상 업종 확인 필요")]

    evidence = asyncio.run(
        evaluate_tax_evidence(
            model,  # type: ignore[arg-type]
            query="음식점 창업 감면 대상이야?",
            documents=documents,
            user_context=None,
        )
    )
    next_query = asyncio.run(
        generate_tax_next_query(
            model,  # type: ignore[arg-type]
            query="음식점 창업 감면 대상이야?",
            documents=documents,
            missing_information=evidence.missing_information,
            user_context=None,
            search_history=["음식점 창업 감면 대상이야?"],
        )
    )

    assert evidence.missing_information == ["업종 요건"]
    assert next_query.query == "조세특례제한법 음식점업 요건"


def test_calculate_tax_plan_supports_half_percent_from_evidence() -> None:
    documents = [_tax_document("tax-1", "가산 비율은 1000분의 5(0.5%)이다.")]
    plan = TaxCalculationPlan(
        calculation_type="percentage_of_amount",
        base_amount="200000",
        rate_percent="0.5",
        cited_source_numbers=[1],
        reason="법령 비율 적용",
    )

    result = calculate_tax_plan(plan, documents=documents)

    assert result["calculated_amount"] == "1000"
    assert result["rate_percent"] == "0.5"


def test_calculate_tax_plan_rejects_rate_not_found_in_cited_source() -> None:
    documents = [_tax_document("tax-1", "법령상 비율은 100분의 15(15%)이다.")]
    plan = TaxCalculationPlan(
        calculation_type="reduction_amount",
        base_amount="100000",
        rate_percent="75",
        cited_source_numbers=[1],
        reason="잘못된 비율",
    )

    with pytest.raises(TaxCalculationError, match="not present"):
        calculate_tax_plan(plan, documents=documents)


def test_calculate_tax_plan_rejects_invented_source_number() -> None:
    plan = TaxCalculationPlan(
        calculation_type="reduction_amount",
        base_amount="100000",
        rate_percent="15",
        cited_source_numbers=[2],
        reason="잘못된 출처",
    )

    with pytest.raises(TaxCalculationError, match="source number"):
        calculate_tax_plan(
            plan,
            documents=[_tax_document("tax-1", "100분의 15(15%)")],
        )


def test_tax_calculation_plan_uses_structured_output() -> None:
    model = FakeStructuredChatModel(
        {
            TaxCalculationPlan: {
                "calculation_type": "amount_after_reduction",
                "base_amount": "1000000",
                "rate_percent": "75",
                "missing_inputs": [],
                "cited_source_numbers": [1],
                "reason": "법령 감면율",
            }
        }
    )

    plan = asyncio.run(
        generate_tax_calculation_plan(
            model,  # type: ignore[arg-type]
            query="산출세액 100만원의 감면 후 금액",
            documents=[_tax_document("tax-1", "100분의 75 감면")],
            user_context=None,
        )
    )

    assert plan.base_amount == "1000000"
    assert plan.rate_percent == "75"
    assert "100분의 75(75%)" in model.last_prompt_text


def test_tax_intent_and_input_planner_use_separate_structured_outputs() -> None:
    model = FakeStructuredChatModel(
        {
            TaxIntentDecision: {
                "calculation_required": True,
                "calculation_type": "income_tax",
                "reason": "산출세액 계산 요청",
            },
            TaxCalculationInputPlan: _input_plan_payload(
                {
                    "tax_base_krw": 50_000_000,
                    "tax_year": 2025,
                },
                reason="질문에 명시됨",
            ),
        }
    )

    intent = asyncio.run(
        classify_tax_intent(
            model,  # type: ignore[arg-type]
            query="2025년 과세표준 5천만원 산출세액은?",
            user_context=None,
        )
    )
    plan = asyncio.run(
        generate_tax_calculation_inputs(
            model,  # type: ignore[arg-type]
            query="2025년 과세표준 5천만원 산출세액은?",
            calculation_type=intent.calculation_type,  # type: ignore[arg-type]
            user_context=None,
        )
    )

    assert intent.calculation_type == "income_tax"
    assert plan.provided_inputs()["tax_base_krw"] == "50000000"
    assert "계산 종류: income_tax" in model.last_prompt_text


def test_tax_intent_corrects_salary_income_tax_to_withholding() -> None:
    model = FakeStructuredChatModel(
        {
            TaxIntentDecision: {
                "calculation_required": True,
                "calculation_type": "income_tax",
                "reason": "소득세 계산 요청",
            }
        }
    )

    intent = asyncio.run(
        classify_tax_intent(
            model,  # type: ignore[arg-type]
            query="2025년 내 월급 세전 280만원인데 소득세 얼마나 내야돼?",
            user_context=None,
        )
    )

    assert intent.calculation_type == "withholding_tax"


@pytest.mark.parametrize(
    "schema_model",
    [TaxIntentDecision, TaxCalculationInputPlan, TaxEvidenceDecision],
)
def test_openai_structured_models_require_every_explicit_property(
    schema_model: type[object],
) -> None:
    schema = schema_model.model_json_schema()  # type: ignore[attr-defined]

    assert set(schema["required"]) == set(schema["properties"])
    assert "calculation_inputs" not in schema["properties"]
    assert "resolved_calculation_inputs" not in schema["properties"]
