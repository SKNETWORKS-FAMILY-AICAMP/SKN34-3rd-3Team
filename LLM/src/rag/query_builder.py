from langsmith import traceable

from src.data.contracts import UserProfile


@traceable(name="build_personalized_query", run_type="chain")
def build_personalized_query(question: str, user: UserProfile) -> str:
    """Combine a question with available profile facts for semantic retrieval."""
    business = user["business"]
    profile_parts = [
        _format_value("나이", user["age"], suffix="세"),
        _format_value("지역", user["region"]),
        _format_value("업종", business["industry"]),
        _format_value("사업자 유형", business["business_type"]),
        _format_value("창업일", business["founded_at"]),
    ]
    available_profile = [part for part in profile_parts if part is not None]
    profile_context = ", ".join(available_profile) or "제공된 사용자 조건 없음"
    return f"사용자 질문: {question}\n사용자 조건: {profile_context}"


def format_user_context(user: UserProfile) -> str:
    business = user["business"]
    return "\n".join(
        [
            f"나이: {_display_value(user['age'], suffix='세')}",
            f"지역: {_display_value(user['region'])}",
            f"업종: {_display_value(business['industry'])}",
            f"사업자 유형: {_display_value(business['business_type'])}",
            f"창업일: {_display_value(business['founded_at'])}",
        ]
    )


def _format_value(label: str, value: object | None, *, suffix: str = "") -> str | None:
    if value is None or str(value).strip() == "":
        return None
    return f"{label} {value}{suffix}"


def _display_value(value: object | None, *, suffix: str = "") -> str:
    if value is None or str(value).strip() == "":
        return "정보 없음"
    return f"{value}{suffix}"
