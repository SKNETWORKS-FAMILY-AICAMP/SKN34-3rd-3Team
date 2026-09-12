"""Tax Multi-hop에서 사용하는 구조화 판단과 최소 법령 참조 해석."""

import json
import re
from decimal import Decimal, InvalidOperation
from typing import Literal, TypeAlias

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, ConfigDict, Field

from src.data.contracts import UserProfile, VectorSearchResult
from src.data.tax_normalization import (
    decimal_text,
    extract_legal_percentages,
    normalize_legal_percentage,
)
from src.serving.tax_calculators_docstring import (
    CalculationType,
    StartupCategory,
    StartupRegion,
)


LegacyCalculationType = Literal[
    "percentage_of_amount",
    "reduction_amount",
    "amount_after_reduction",
]
GraphCalculationType: TypeAlias = CalculationType | LegacyCalculationType
CalculationValue: TypeAlias = str | int | float | bool | None


class TaxIntentDecision(BaseModel):
    """Tax 질문의 계산 필요 여부와 계산기 종류를 결정한다."""

    model_config = ConfigDict(extra="forbid")

    calculation_required: bool
    calculation_type: GraphCalculationType | None
    reason: str


class TaxCalculationInputPlan(BaseModel):
    """이미 선택된 계산기에 필요한 사용자 입력만 추출한다."""

    model_config = ConfigDict(extra="forbid")

    tax_base_krw: str | None
    tax_year: int | None
    monthly_salary_krw: str | None
    family_count: int | None
    child_count: int | None
    taxable_sales_supply_value_krw: str | None
    deductible_input_tax_krw: str | None
    tax_credit_krw: str | None
    prepaid_tax_krw: str | None
    penalty_tax_krw: str | None
    sales_amount_krw: str | None
    industry: str | None
    eligible_tax_krw: str | None
    startup_year: int | None
    age: int | None
    business_location: str | None
    first_startup: bool | None
    base_amount: str | None
    missing_required_inputs: list[str]
    reason: str

    def provided_inputs(self) -> dict[str, CalculationValue]:
        """명시적으로 추출된 값만 GraphState용 dict로 반환한다."""
        return self.model_dump(
            exclude={"missing_required_inputs", "reason"},
            exclude_none=True,
        )


class TaxEvidenceDecision(BaseModel):
    """법령 근거와 사용자 Context의 충족 여부를 분리한 구조화 판단."""

    model_config = ConfigDict(extra="forbid")

    sufficient: bool
    missing_information: list[str]
    missing_user_context: list[str]
    calculation_required: bool
    resolved_category: StartupCategory | None
    resolved_region: StartupRegion | None
    resolved_rate_percent: str | None
    cited_source_numbers: list[int]
    reason: str

    def resolved_inputs(self) -> dict[str, CalculationValue]:
        """검증된 내부 법적 값을 기존 GraphState dict로 변환한다."""
        values: dict[str, CalculationValue] = {}
        if self.resolved_category is not None:
            values["category"] = self.resolved_category
        if self.resolved_region is not None:
            values["region"] = self.resolved_region
        if self.resolved_rate_percent is not None:
            values["rate_percent"] = self.resolved_rate_percent
        return values


class TaxNextQuery(BaseModel):
    """명시적 법령 참조가 없을 때 생성하는 다음 검색 Query."""

    model_config = ConfigDict(extra="forbid")

    query: str | None
    target_law: str | None = None
    target_article: str | None = None
    reason: str


class TaxCalculationPlan(BaseModel):
    """근거에서 추출한 최소 결정적 계산 계획."""

    model_config = ConfigDict(extra="forbid")

    calculation_type: LegacyCalculationType
    base_amount: str | None = None
    rate_percent: str | None = None
    missing_inputs: list[str] = Field(default_factory=list)
    cited_source_numbers: list[int] = Field(default_factory=list)
    reason: str


class TaxCalculationError(ValueError):
    """입력값이나 법령 출처로 계산 계획을 검증할 수 없을 때 발생한다."""


EVIDENCE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "세법 질문에 답하기 위한 법령 근거가 충분한지 판단하세요. "
            "법령 근거 부족은 missing_information에, 사용자 나이·지역·업종·"
            "창업일 등 사용자 정보 부족은 missing_user_context에 분리하세요. "
            "계산 필요 여부와 계산 종류는 앞 단계가 이미 결정했으므로 뒤집지 마세요. "
            "계산에 법적 자격 판정이 필요한 경우에만 사용자 Context와 근거를 이용해 "
            "calculator 내부 값은 resolved_category, resolved_region, "
            "resolved_rate_percent에 기록하세요. 해당하지 않는 값은 null입니다. "
            "근거 없이 값을 만들지 말고, 사용한 출처 번호를 "
            "cited_source_numbers에 기록하세요. calculation_required는 입력으로 주어진 "
            "값을 그대로 반환하세요.",
        ),
        (
            "human",
            "질문: {query}\n사용자 Context: {user_context}\n"
            "계산 필요: {calculation_required}\n계산 종류: {calculation_type}\n"
            "계산용 사용자 입력: {calculation_inputs}\n"
            "정규화된 비율: {normalized_ratios}\n법령 근거:\n{evidence}",
        ),
    ]
)

INTENT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "세금 질문이 실제 숫자 계산을 요청하는지 판단하고, 계산 요청일 때만 "
            "지원 계산기 종류를 하나 선택하세요. 조건·세율·과세표준 구간 등 설명만 "
            "묻는 질문은 calculation_required=false입니다. 지원 종류는 income_tax, "
            "withholding_tax, general_vat, simplified_vat_output_tax, "
            "startup_tax_reduction 및 기존 법령 비율 계산인 percentage_of_amount, "
            "reduction_amount, amount_after_reduction입니다. 월급·급여·세전 급여에서 "
            "떼는 소득세 질문은 withholding_tax이고, income_tax는 매출이나 급여가 "
            "아닌 확정 과세표준으로 종합소득 산출세액을 묻는 경우입니다. 직접 "
            "계산하지 마세요.",
        ),
        ("human", "질문: {query}\n사용자 Context: {user_context}"),
    ]
)

CALCULATION_INPUT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "계산 종류는 이미 확정되었습니다. 다시 분류하거나 변경하지 말고 질문과 "
            "사용자 Context에 실제 있는 값만 calculation_inputs로 추출하세요. "
            "없는 금액·가족 수·연도·업종·지역·세율·공제액·법적 자격을 추정하지 "
            "마세요. missing_required_inputs에는 사용자가 제공해야 하는 현실의 정보만 "
            "구체적인 한국어 이름으로 기록하세요. category, region 같은 calculator "
            "내부 값은 사용자에게 요구하지 마세요. "
            "income_tax의 과세표준은 매출·총수입과 구분하고 귀속연도가 불명확하면 "
            "확인을 요청하세요. 입력 키는 income_tax: tax_base_krw, tax_year; "
            "withholding_tax: monthly_salary_krw, family_count, 선택 child_count; "
            "withholding_tax에서 가족 수나 자녀 수가 없으면 각각 null로 반환하고 "
            "missing_required_inputs에는 넣지 마세요. Graph가 공개된 기본 가정을 "
            "적용합니다. "
            "general_vat에서 공제 매입세액·세액공제·기납부세액·가산세가 없으면 "
            "각각 null로 반환하고 missing_required_inputs에 넣지 마세요. "
            "Graph가 0원 가정을 명시하고 계산합니다. "
            "general_vat: taxable_sales_supply_value_krw와 명시된 선택 공제·기납부·"
            "가산세; simplified_vat_output_tax: sales_amount_krw, 실제 업종 industry; "
            "startup_tax_reduction: eligible_tax_krw, startup_year 및 명시된 age, "
            "business_location, industry, first_startup; 기존 비율 계산: base_amount를 "
            "사용하세요. startup의 실제 사업장 위치는 business_location으로 추출하고 "
            "category나 region으로 변환하지 마세요. 산술은 하지 마세요. "
            "금액은 원, 쉼표, 억·만·천 같은 단위를 제거한 원 단위 숫자 문자열로 "
            "반환하세요(예: 5천만원은 50000000). "
            "선택한 계산기에 해당하지 않는 모든 입력 필드도 생략하지 말고 null로 "
            "반환하세요.",
        ),
        (
            "human",
            "계산 종류: {calculation_type}\n질문: {query}\n"
            "사용자 Context: {user_context}",
        ),
    ]
)

NEXT_QUERY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "부족한 세법 근거를 찾기 위한 다음 검색어 하나만 구조화해 반환하세요. "
            "이미 실행한 검색어를 반복하지 마세요. 검색을 더 구체화할 수 없으면 "
            "query를 null로 반환하세요.",
        ),
        (
            "human",
            "원 질문: {query}\n부족한 정보: {missing_information}\n"
            "사용자 Context: {user_context}\n검색 이력: {search_history}\n"
            "현재 근거:\n{evidence}",
        ),
    ]
)

CALCULATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "세금 계산 결과를 직접 만들지 말고 계산 계획만 구조화하세요. "
            "base_amount는 질문 또는 사용자 Context에 명시된 값만 사용하고, "
            "rate_percent는 법령 근거에 실제 표시된 비율만 사용하세요. "
            "과세표준과 산출세액을 혼동하지 마세요. 값이 없으면 추정하지 말고 "
            "missing_inputs에 필요한 항목을 기록하세요. 사용한 법령 출처 번호를 "
            "cited_source_numbers에 기록하세요.",
        ),
        (
            "human",
            "질문: {query}\n사용자 Context: {user_context}\n법령 근거:\n{evidence}",
        ),
    ]
)

_NAMED_REFERENCE = re.compile(
    r"([가-힣A-Za-z0-9·]+법(?:\s+시행령|\s+시행규칙)?)\s*제\s*(\d+)\s*조"
)
_SAME_LAW_REFERENCE = re.compile(r"같은\s*법\s*제\s*(\d+)\s*조")
_ARTICLE_REFERENCE = re.compile(r"제\s*(\d+)\s*조(?:에\s*따른|의)??")
_PRESIDENTIAL_DECREE = re.compile(r"대통령령으로\s*정하는")


async def evaluate_tax_evidence(
    llm: BaseChatModel,
    *,
    query: str,
    documents: list[VectorSearchResult],
    user_context: UserProfile | None,
    normalized_ratios: list[dict[str, object]] | None = None,
    calculation_required: bool = False,
    calculation_type: GraphCalculationType | None = None,
    calculation_inputs: dict[str, CalculationValue] | None = None,
) -> TaxEvidenceDecision:
    """누적 법령과 사용자 Context를 Structured Output으로 평가한다."""
    chain = EVIDENCE_PROMPT | llm.with_structured_output(TaxEvidenceDecision)
    result = await chain.ainvoke(
        {
            "query": query,
            "user_context": json.dumps(user_context, ensure_ascii=False),
            "calculation_required": calculation_required,
            "calculation_type": calculation_type,
            "calculation_inputs": json.dumps(
                calculation_inputs or {}, ensure_ascii=False
            ),
            "normalized_ratios": json.dumps(
                normalized_ratios or [], ensure_ascii=False
            ),
            "evidence": _format_evidence(documents),
        },
        config={"run_name": "tax_evidence_evaluator"},
    )
    return TaxEvidenceDecision.model_validate(result)


async def classify_tax_intent(
    llm: BaseChatModel,
    *,
    query: str,
    user_context: UserProfile | None,
) -> TaxIntentDecision:
    """계산 필요 여부와 계산 종류를 Structured Output으로 한 번만 결정한다."""
    chain = INTENT_PROMPT | llm.with_structured_output(TaxIntentDecision)
    result = await chain.ainvoke(
        {
            "query": query,
            "user_context": json.dumps(user_context, ensure_ascii=False),
        },
        config={"run_name": "tax_intent_classifier"},
    )
    decision = _disambiguate_tax_intent(
        query,
        TaxIntentDecision.model_validate(result),
    )
    if decision.calculation_required != (decision.calculation_type is not None):
        raise ValueError("Tax intent calculation_required/type mismatch")
    return decision


def _disambiguate_tax_intent(
    query: str,
    decision: TaxIntentDecision,
) -> TaxIntentDecision:
    """명백한 급여 원천징수 질문을 종합소득 과세표준 계산과 구분한다."""
    if not decision.calculation_required:
        return decision
    normalized_query = query.casefold().replace(" ", "")
    wage_keywords = ("월급", "급여", "세전", "월봉", "근로소득세", "원천징수")
    if (
        decision.calculation_type == "income_tax"
        and any(keyword in normalized_query for keyword in wage_keywords)
    ):
        return decision.model_copy(
            update={
                "calculation_type": "withholding_tax",
                "reason": "명시적인 급여 원천징수 계산 질문",
            }
        )
    return decision


async def generate_tax_calculation_inputs(
    llm: BaseChatModel,
    *,
    query: str,
    calculation_type: GraphCalculationType,
    user_context: UserProfile | None,
) -> TaxCalculationInputPlan:
    """Tax Intent가 선택한 계산기를 바꾸지 않고 명시적 입력만 추출한다."""
    chain = CALCULATION_INPUT_PROMPT | llm.with_structured_output(
        TaxCalculationInputPlan
    )
    result = await chain.ainvoke(
        {
            "query": query,
            "calculation_type": calculation_type,
            "user_context": json.dumps(user_context, ensure_ascii=False),
        },
        config={"run_name": "tax_calculation_input_planner"},
    )
    return TaxCalculationInputPlan.model_validate(result)


async def generate_tax_next_query(
    llm: BaseChatModel,
    *,
    query: str,
    documents: list[VectorSearchResult],
    missing_information: list[str],
    user_context: UserProfile | None,
    search_history: list[str],
) -> TaxNextQuery:
    """Reference로 검색어를 정할 수 없을 때 다음 검색어를 생성한다."""
    chain = NEXT_QUERY_PROMPT | llm.with_structured_output(TaxNextQuery)
    result = await chain.ainvoke(
        {
            "query": query,
            "missing_information": ", ".join(missing_information),
            "user_context": json.dumps(user_context, ensure_ascii=False),
            "search_history": " | ".join(search_history),
            "evidence": _format_evidence(documents),
        },
        config={"run_name": "tax_next_query_generator"},
    )
    return TaxNextQuery.model_validate(result)


async def generate_tax_calculation_plan(
    llm: BaseChatModel,
    *,
    query: str,
    documents: list[VectorSearchResult],
    user_context: UserProfile | None,
) -> TaxCalculationPlan:
    """검색 근거와 명시적 사용자 값만 이용해 계산 계획을 생성한다."""
    chain = CALCULATION_PROMPT | llm.with_structured_output(TaxCalculationPlan)
    result = await chain.ainvoke(
        {
            "query": query,
            "user_context": json.dumps(user_context, ensure_ascii=False),
            "evidence": _format_evidence(documents),
        },
        config={"run_name": "tax_calculation_plan"},
    )
    return TaxCalculationPlan.model_validate(result)


def calculate_tax_plan(
    plan: TaxCalculationPlan,
    *,
    documents: list[VectorSearchResult],
) -> dict[str, object]:
    """검증된 기준금액과 법령 비율을 Decimal로 계산한다.

    Raises:
        TaxCalculationError: 필수 입력, 출처 또는 근거 비율이 유효하지 않을 때.
    """
    if plan.missing_inputs:
        raise TaxCalculationError("calculation inputs are missing")
    if plan.base_amount is None or plan.rate_percent is None:
        raise TaxCalculationError("base_amount and rate_percent are required")
    try:
        base_amount = Decimal(plan.base_amount.replace(",", ""))
        rate_percent = Decimal(plan.rate_percent.replace(",", ""))
    except InvalidOperation as exc:
        raise TaxCalculationError("calculation contains an invalid decimal") from exc
    if base_amount < 0:
        raise TaxCalculationError("base_amount must not be negative")
    if not Decimal(0) <= rate_percent <= Decimal(100):
        raise TaxCalculationError("rate_percent must be between 0 and 100")

    source_numbers = list(dict.fromkeys(plan.cited_source_numbers))
    if not source_numbers or any(
        number < 1 or number > len(documents) for number in source_numbers
    ):
        raise TaxCalculationError("calculation source number is invalid")
    cited_documents = [documents[number - 1] for number in source_numbers]
    supported_rates = set().union(
        *(extract_legal_percentages(document["content"]) for document in cited_documents)
    )
    if rate_percent not in supported_rates:
        raise TaxCalculationError("rate_percent is not present in cited evidence")

    proportional_amount = base_amount * rate_percent / Decimal(100)
    if plan.calculation_type == "amount_after_reduction":
        result_amount = base_amount - proportional_amount
        result_name = "amount_after_reduction"
        formula = "base_amount - (base_amount × rate_percent ÷ 100)"
    else:
        result_amount = proportional_amount
        result_name = (
            "reduction_amount"
            if plan.calculation_type == "reduction_amount"
            else "calculated_amount"
        )
        formula = "base_amount × rate_percent ÷ 100"

    try:
        values = {
            "calculation_type": plan.calculation_type,
            "base_amount": decimal_text(base_amount),
            "rate_percent": decimal_text(rate_percent),
            result_name: decimal_text(result_amount),
            "formula": formula,
            "cited_source_numbers": source_numbers,
        }
    except InvalidOperation as exc:
        raise TaxCalculationError("calculation contains an invalid decimal") from exc
    return values


def resolve_legal_reference(
    documents: list[VectorSearchResult],
    *,
    search_history: list[str],
) -> str | None:
    """누적 근거에서 최소 법령 패턴을 찾아 아직 검색하지 않은 참조를 반환한다."""
    searched = {query.casefold().strip() for query in search_history}
    for document in reversed(documents):
        content = document["content"]
        title = document["title"].strip()
        candidates = [
            f"{law_name} 제{article}조"
            for law_name, article in _NAMED_REFERENCE.findall(content)
        ]
        candidates.extend(
            f"{title} 제{article}조"
            for article in _SAME_LAW_REFERENCE.findall(content)
        )
        if _PRESIDENTIAL_DECREE.search(content) and title.endswith("법"):
            candidates.append(f"{title} 시행령")
        candidates.extend(
            f"{title} 제{article}조"
            for article in _ARTICLE_REFERENCE.findall(content)
        )
        for candidate in candidates:
            normalized = candidate.casefold().strip()
            if normalized and normalized not in searched:
                return candidate
    return None


def merge_evidence(
    existing: list[VectorSearchResult],
    new_documents: list[VectorSearchResult],
) -> list[VectorSearchResult]:
    """Chunk ID 기준으로 기존 순서를 유지하며 새로운 법령 근거만 누적한다."""
    merged = list(existing)
    seen = {document["chunk_id"] for document in existing}
    for document in new_documents:
        if document["chunk_id"] not in seen:
            merged.append(document)
            seen.add(document["chunk_id"])
    return merged


def _format_evidence(documents: list[VectorSearchResult]) -> str:
    """검색된 원문을 변경하지 않고 Prompt에서만 법령 비율을 함께 표시한다."""
    return "\n\n".join(
        f"[{index}] {document['title']}\n"
        f"{normalize_legal_percentage(document['content'])}\n"
        f"source={document['source']} chunk_id={document['chunk_id']}"
        for index, document in enumerate(documents, start=1)
    ) or "근거 없음"
