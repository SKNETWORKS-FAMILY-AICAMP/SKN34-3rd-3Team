"""
tax_calculators_docstring.py

국세청 공개 자료 기반 MVP용 deterministic 세금 계산기.
각 함수의 파라미터 설명은 함수 내부 docstring의 Args 섹션에 정리되어 있습니다.
"""

from __future__ import annotations

from csv import DictReader
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Iterable, Literal, Mapping


Money = int | float | str | Decimal

StartupCategory = Literal[
    "startup_sme",
    "youth_or_livelihood",
]

StartupRegion = Literal[
    "capital_overconcentration",
    "capital_region_other",
    "outside_capital_region",
]

SimplifiedVatIndustry = Literal[
    "retail_recycling_food",
    "manufacturing_agriculture_forestry_fishery_small_cargo",
    "lodging",
    "construction_transport_storage_information",
    "finance_professional_support_real_estate",
    "other_services",
]

CalculationType = Literal[
    "income_tax",
    "startup_tax_reduction",
    "general_vat",
    "simplified_vat_output_tax",
    "withholding_tax",
]


class TaxCalculationError(ValueError):
    """세금 계산 입력값 오류."""


def _to_decimal(value: Money, *, name: str) -> Decimal:
    """
    Args:
        value (Money): Decimal로 변환할 숫자 값.
        name (str): 오류 메시지에 표시할 입력값 이름.

    Returns:
        Decimal: 변환된 Decimal 값.
    """
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise TaxCalculationError(f"{name} 값이 숫자가 아닙니다: {value!r}") from exc

    if number < 0:
        raise TaxCalculationError(f"{name} 값은 0 이상이어야 합니다.")

    return number


def _money_string(value: Decimal) -> str:
    """
    Args:
        value (Decimal): 문자열로 변환할 금액.

    Returns:
        str: 소수점 둘째 자리까지 표현한 금액 문자열.
    """
    return format(value.quantize(Decimal("0.01")), "f")


# ===========================================================================
# 1. 종합소득세
# ===========================================================================

INCOME_TAX_BRACKETS_2023_2025 = (
    (Decimal("0"), Decimal("14000000"), Decimal("0.06"), Decimal("0")),
    (Decimal("14000000"), Decimal("50000000"), Decimal("0.15"), Decimal("1260000")),
    (Decimal("50000000"), Decimal("88000000"), Decimal("0.24"), Decimal("5760000")),
    (Decimal("88000000"), Decimal("150000000"), Decimal("0.35"), Decimal("15440000")),
    (Decimal("150000000"), Decimal("300000000"), Decimal("0.38"), Decimal("19940000")),
    (Decimal("300000000"), Decimal("500000000"), Decimal("0.40"), Decimal("25940000")),
    (Decimal("500000000"), Decimal("1000000000"), Decimal("0.42"), Decimal("35940000")),
    (Decimal("1000000000"), None, Decimal("0.45"), Decimal("65940000")),
)


def calculate_income_tax(
    tax_base_krw: Money,
    *,
    tax_year: int = 2025,
) -> dict:
    """
    종합소득 과세표준을 기준으로 산출세액을 계산한다.

    Args:
        tax_base_krw (Money):
            종합소득 과세표준 금액(원).
            매출액이나 총수입이 아니라 공제 등을 반영한 뒤 확정된 과세표준을 입력한다.
            예: 50_000_000

        tax_year (int):
            귀속연도.
            현재 지원 범위는 2023, 2024, 2025.
            기본값은 2025.

    Returns:
        dict:
            적용 세율, 누진공제액, 종합소득 산출세액 등을 반환한다.
    """
    if tax_year not in (2023, 2024, 2025):
        raise TaxCalculationError(
            "현재 종합소득세 계산기는 2023~2025 귀속만 지원합니다."
        )

    base = _to_decimal(tax_base_krw, name="과세표준")

    for minimum, maximum, rate, deduction in INCOME_TAX_BRACKETS_2023_2025:
        if base >= minimum and (maximum is None or base <= maximum):
            tax = max(base * rate - deduction, Decimal("0"))

            return {
                "calculation_type": "income_tax",
                "tax_year": tax_year,
                "tax_base_krw": _money_string(base),
                "rate": str(rate),
                "rate_percent": str(rate * 100),
                "progressive_deduction_krw": _money_string(deduction),
                "calculated_income_tax_krw": _money_string(tax),
            }

    raise TaxCalculationError("과세표준 구간을 찾지 못했습니다.")


# ===========================================================================
# 2. 청년창업 / 창업중소기업 세액감면
# ===========================================================================

STARTUP_REDUCTION_RATES_2026: dict[str, dict[str, Decimal | None]] = {
    "startup_sme": {
        "capital_overconcentration": None,
        "capital_region_other": Decimal("0.25"),
        "outside_capital_region": Decimal("0.50"),
    },
    "youth_or_livelihood": {
        "capital_overconcentration": Decimal("0.50"),
        "capital_region_other": Decimal("0.75"),
        "outside_capital_region": Decimal("1.00"),
    },
}

STARTUP_ANNUAL_REDUCTION_CAP_KRW_2026 = Decimal("500000000")


def get_startup_reduction_rate(
    *,
    category: StartupCategory,
    region: StartupRegion,
) -> Decimal:
    """
    창업 유형과 지역을 기준으로 기본 세액감면율을 반환한다.

    Args:
        category (StartupCategory):
            창업 감면 유형.
            "startup_sme" = 일반 창업중소기업
            "youth_or_livelihood" = 청년창업 또는 생계형 창업

        region (StartupRegion):
            사업장 지역 구분.
            "capital_overconcentration" = 수도권 과밀억제권역
            "capital_region_other" = 수도권이지만 과밀억제권역 밖
            "outside_capital_region" = 수도권 밖

    Returns:
        Decimal:
            감면율.
            예: Decimal("0.50") = 50%
    """
    try:
        rate = STARTUP_REDUCTION_RATES_2026[category][region]
    except KeyError as exc:
        raise TaxCalculationError(
            f"지원하지 않는 감면 조건입니다: category={category}, region={region}"
        ) from exc

    if rate is None:
        raise TaxCalculationError(
            "현재 확보한 국세청 요약자료만으로 해당 조건의 감면율을 확정할 수 없습니다."
        )

    return rate


def calculate_startup_tax_reduction(
    eligible_tax_krw: Money,
    *,
    category: StartupCategory,
    region: StartupRegion,
    startup_year: int = 2026,
    annual_cap_krw: Money = STARTUP_ANNUAL_REDUCTION_CAP_KRW_2026,
) -> dict:
    """
    청년창업 또는 창업중소기업의 세액감면액을 계산한다.

    Args:
        eligible_tax_krw (Money):
            감면 적용 전 세액(원).
            매출액이나 소득금액이 아니라 감면 대상이 되는 세액을 입력한다.
            예: 3_000_000

        category (StartupCategory):
            창업 감면 유형.
            "startup_sme" = 일반 창업중소기업
            "youth_or_livelihood" = 청년창업 또는 생계형 창업

        region (StartupRegion):
            사업장 지역 구분.
            "capital_overconcentration" = 수도권 과밀억제권역
            "capital_region_other" = 수도권이지만 과밀억제권역 밖
            "outside_capital_region" = 수도권 밖

        startup_year (int):
            창업연도.
            현재 함수는 2026년 이후 창업 기준.
            기본값은 2026.

        annual_cap_krw (Money):
            연간 감면 한도(원).
            기본값은 500_000_000원.

    Returns:
        dict:
            감면율, 감면 전 세액, 감면액, 감면 후 세액 등을 반환한다.
    """
    if startup_year < 2026:
        raise TaxCalculationError(
            "현재 이 함수는 2026.1.1 이후 창업 기준 감면율을 사용합니다."
        )

    eligible_tax = _to_decimal(eligible_tax_krw, name="감면 대상 세액")
    cap = _to_decimal(annual_cap_krw, name="연간 감면 한도")

    rate = get_startup_reduction_rate(
        category=category,
        region=region,
    )

    raw_reduction = eligible_tax * rate
    reduction = min(raw_reduction, cap)
    tax_after_reduction = max(eligible_tax - reduction, Decimal("0"))

    return {
        "calculation_type": "startup_tax_reduction",
        "startup_year": startup_year,
        "category": category,
        "region": region,
        "eligible_tax_krw": _money_string(eligible_tax),
        "reduction_rate": str(rate),
        "reduction_rate_percent": str(rate * 100),
        "raw_reduction_krw": _money_string(raw_reduction),
        "annual_cap_krw": _money_string(cap),
        "reduction_amount_krw": _money_string(reduction),
        "tax_after_reduction_krw": _money_string(tax_after_reduction),
    }


# ===========================================================================
# 3. 일반과세자 부가가치세
# ===========================================================================

VAT_GENERAL_RATE = Decimal("0.10")


def calculate_general_vat(
    taxable_sales_supply_value_krw: Money,
    *,
    deductible_input_tax_krw: Money = 0,
    tax_credit_krw: Money = 0,
    prepaid_tax_krw: Money = 0,
    penalty_tax_krw: Money = 0,
) -> dict:
    """
    일반과세자의 기본 부가가치세를 계산한다.

    Args:
        taxable_sales_supply_value_krw (Money):
            부가가치세가 제외된 과세 공급가액(원).
            예: 10_000_000

        deductible_input_tax_krw (Money):
            공제 가능한 매입세액(원).
            값이 없으면 0.
            예: 400_000

        tax_credit_krw (Money):
            적용 가능한 세액공제 금액(원).
            값이 없으면 0.

        prepaid_tax_krw (Money):
            이미 납부한 세액(원).
            값이 없으면 0.

        penalty_tax_krw (Money):
            가산세 금액(원).
            값이 없으면 0.

    Returns:
        dict:
            매출세액, 공제가능 매입세액, 조정 전 세액,
            세액공제, 기납부세액, 가산세, 최종 계산세액을 반환한다.
    """
    sales = _to_decimal(
        taxable_sales_supply_value_krw,
        name="과세 공급가액",
    )
    input_tax = _to_decimal(
        deductible_input_tax_krw,
        name="공제가능 매입세액",
    )
    credit = _to_decimal(
        tax_credit_krw,
        name="세액공제",
    )
    prepaid = _to_decimal(
        prepaid_tax_krw,
        name="기납부세액",
    )
    penalty = _to_decimal(
        penalty_tax_krw,
        name="가산세",
    )

    output_tax = sales * VAT_GENERAL_RATE
    before_adjustments = output_tax - input_tax
    final_tax = before_adjustments - credit - prepaid + penalty

    return {
        "calculation_type": "general_vat",
        "taxable_sales_supply_value_krw": _money_string(sales),
        "vat_rate": str(VAT_GENERAL_RATE),
        "vat_rate_percent": "10",
        "output_tax_krw": _money_string(output_tax),
        "deductible_input_tax_krw": _money_string(input_tax),
        "tax_before_adjustments_krw": _money_string(before_adjustments),
        "tax_credit_krw": _money_string(credit),
        "prepaid_tax_krw": _money_string(prepaid),
        "penalty_tax_krw": _money_string(penalty),
        "final_tax_krw": _money_string(final_tax),
        "status": "payable" if final_tax > 0 else "refund_or_zero",
    }


# ===========================================================================
# 4. 간이과세자 부가가치세
# ===========================================================================

SIMPLIFIED_VAT_VALUE_ADDED_RATIOS: dict[str, Decimal] = {
    "retail_recycling_food": Decimal("0.15"),
    "manufacturing_agriculture_forestry_fishery_small_cargo": Decimal("0.20"),
    "lodging": Decimal("0.25"),
    "construction_transport_storage_information": Decimal("0.30"),
    "finance_professional_support_real_estate": Decimal("0.40"),
    "other_services": Decimal("0.30"),
}


def calculate_simplified_vat_output_tax(
    sales_amount_krw: Money,
    *,
    industry_group: SimplifiedVatIndustry,
) -> dict:
    """
    간이과세자의 기본 매출세액을 계산한다.

    Args:
        sales_amount_krw (Money):
            부가가치세를 포함한 공급대가(원).
            예: 20_000_000

        industry_group (SimplifiedVatIndustry):
            간이과세 업종 그룹.
            "retail_recycling_food"
                = 소매업·재생용 재료수집 및 판매업·음식점업

            "manufacturing_agriculture_forestry_fishery_small_cargo"
                = 제조업·농업·임업·어업·소화물 전문 운송업

            "lodging"
                = 숙박업

            "construction_transport_storage_information"
                = 건설업·운수 및 창고업·정보통신업

            "finance_professional_support_real_estate"
                = 금융·전문서비스·사업지원·부동산 관련 업종

            "other_services"
                = 그 밖의 서비스업

    Returns:
        dict:
            업종별 부가가치율과 기본 매출세액을 반환한다.
            최종 납부세액은 아니다.
    """
    sales = _to_decimal(
        sales_amount_krw,
        name="공급대가",
    )

    try:
        ratio = SIMPLIFIED_VAT_VALUE_ADDED_RATIOS[industry_group]
    except KeyError as exc:
        raise TaxCalculationError(
            "지원하지 않는 간이과세 업종 그룹입니다."
        ) from exc

    output_tax = sales * ratio * VAT_GENERAL_RATE

    return {
        "calculation_type": "simplified_vat_output_tax",
        "sales_amount_krw": _money_string(sales),
        "industry_group": industry_group,
        "industry_value_added_ratio": str(ratio),
        "industry_value_added_ratio_percent": str(ratio * 100),
        "vat_rate": str(VAT_GENERAL_RATE),
        "basic_output_tax_krw": _money_string(output_tax),
    }


# ===========================================================================
# 5. 근로소득 간이세액표
# ===========================================================================

def load_normalized_withholding_csv(
    path: str | Path,
) -> list[dict]:
    """
    정규화된 근로소득 간이세액표 CSV를 불러온다.

    Args:
        path (str | Path):
            정규화된 간이세액표 CSV 파일 경로.
            예: "data/withholding_tax_table.csv"

            CSV 필수 컬럼:
            - salary_min_krw
            - salary_max_krw
            - family_count
            - withholding_tax_krw

            CSV 선택 컬럼:
            - child_count

    Returns:
        list[dict]:
            간이세액표의 각 행을 dict 형태로 반환한다.
    """
    path = Path(path)

    if not path.exists():
        raise TaxCalculationError(
            f"간이세액표 CSV가 존재하지 않습니다: {path}"
        )

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        rows = list(DictReader(file))

    required_columns = {
        "salary_min_krw",
        "salary_max_krw",
        "family_count",
        "withholding_tax_krw",
    }

    if not rows:
        raise TaxCalculationError("간이세액표 CSV가 비어 있습니다.")

    missing_columns = required_columns - set(rows[0])

    if missing_columns:
        raise TaxCalculationError(
            "간이세액표 CSV 필수 컬럼이 없습니다: "
            + ", ".join(sorted(missing_columns))
        )

    return rows


def calculate_withholding_tax(
    monthly_salary_krw: Money,
    *,
    family_count: int,
    table_rows: Iterable[Mapping[str, str]],
    child_count: int | None = None,
) -> dict:
    """
    국세청 근로소득 간이세액표에서 원천징수 소득세를 조회한다.

    Args:
        monthly_salary_krw (Money):
            월 급여액(원).
            예: 3_200_000

        family_count (int):
            공제대상 가족 수.
            1 이상의 정수를 입력한다.
            예: 1, 2, 3

        table_rows (Iterable[Mapping[str, str]]):
            정규화된 국세청 근로소득 간이세액표 데이터.
            일반적으로 load_normalized_withholding_csv() 반환값을 전달한다.

        child_count (int | None):
            공제대상 자녀 수.
            0 이상의 정수 또는 None.
            값이 없으면 None.
            예: 0, 1, 2, None

    Returns:
        dict:
            월 급여, 가족 수, 자녀 수, 해당 급여 구간,
            원천징수 소득세액을 반환한다.
    """
    salary = _to_decimal(
        monthly_salary_krw,
        name="월 급여",
    )

    if family_count < 1:
        raise TaxCalculationError(
            "공제대상 가족 수는 1 이상이어야 합니다."
        )

    if child_count is not None and child_count < 0:
        raise TaxCalculationError(
            "자녀 수는 0 이상이어야 합니다."
        )

    fallback_match = None

    for row in table_rows:
        try:
            salary_min = Decimal(row["salary_min_krw"])
            salary_max_raw = row["salary_max_krw"].strip()
            salary_max = Decimal(salary_max_raw) if salary_max_raw else None
            row_family_count = int(row["family_count"])
            withholding_tax = Decimal(row["withholding_tax_krw"])
        except (KeyError, ValueError, InvalidOperation) as exc:
            raise TaxCalculationError(
                "간이세액표 행 형식이 올바르지 않습니다."
            ) from exc

        if row_family_count != family_count:
            continue

        if salary < salary_min:
            continue

        if salary_max is not None and salary > salary_max:
            continue

        row_child_raw = str(
            row.get("child_count", "")
        ).strip()

        result = {
            "calculation_type": "withholding_tax_table_lookup",
            "monthly_salary_krw": _money_string(salary),
            "family_count": family_count,
            "child_count": child_count,
            "withholding_income_tax_krw": _money_string(withholding_tax),
            "salary_range_min_krw": _money_string(salary_min),
            "salary_range_max_krw": (
                _money_string(salary_max)
                if salary_max is not None
                else None
            ),
        }

        if child_count is None:
            return result

        if not row_child_raw:
            fallback_match = result
            continue

        if int(row_child_raw) == child_count:
            return result

    if fallback_match is not None:
        return fallback_match

    raise TaxCalculationError(
        "해당 월 급여/가족 수 조건에 맞는 간이세액표 행을 찾지 못했습니다."
    )


# ===========================================================================
# 6. LangGraph용 Dispatcher
# ===========================================================================

def calculate_tax(
    calculation_type: CalculationType,
    **kwargs,
) -> dict:
    """
    calculation_type에 따라 적절한 세금 계산 함수를 호출한다.

    Args:
        calculation_type (CalculationType):
            실행할 계산기 종류.

            "income_tax"
                = 종합소득세 산출세액 계산

            "startup_tax_reduction"
                = 청년창업/창업중소기업 세액감면 계산

            "general_vat"
                = 일반과세자 부가가치세 계산

            "simplified_vat_output_tax"
                = 간이과세자 기본 매출세액 계산

            "withholding_tax"
                = 근로소득 간이세액표 조회

        **kwargs:
            선택된 계산기 함수에 전달할 파라미터.

            예:
            calculation_type="income_tax"이면

            tax_base_krw=50_000_000
            tax_year=2025

    Returns:
        dict:
            선택된 계산기의 계산 결과.
    """
    calculators = {
        "income_tax": calculate_income_tax,
        "startup_tax_reduction": calculate_startup_tax_reduction,
        "general_vat": calculate_general_vat,
        "simplified_vat_output_tax": calculate_simplified_vat_output_tax,
        "withholding_tax": calculate_withholding_tax,
    }

    try:
        calculator = calculators[calculation_type]
    except KeyError as exc:
        raise TaxCalculationError(
            f"지원하지 않는 calculation_type입니다: {calculation_type}"
        ) from exc

    return calculator(**kwargs)
