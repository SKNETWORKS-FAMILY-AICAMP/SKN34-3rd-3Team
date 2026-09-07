from collections.abc import Mapping
from typing import Any

from psycopg.rows import dict_row

from src.core.config import Settings
from src.core.database import connect_database
from src.data.contracts import Policy, RagSourceDocument, UserProfile


class DatabaseDataNotFoundError(LookupError):
    """실제 PostgreSQL에 요청한 데이터가 없을 때 발생한다."""


def get_user_profile(user_id: int, settings: Settings) -> UserProfile:
    """PostgreSQL에서 사용자와 사업자 프로필을 함께 조회한다.

    Args:
        user_id: 조회할 실제 사용자 식별자.
        settings: PostgreSQL 연결 설정.

    Returns:
        RAG 개인화 Query에서 사용하는 사용자·사업자 정보.

    Raises:
        DatabaseDataNotFoundError: 사용자 또는 사업자 프로필이 없을 때.
    """
    with connect_database(settings) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT
                    u.id AS user_id,
                    u.age,
                    u.region,
                    bp.industry,
                    bp.business_type,
                    bp.founded_at
                FROM users AS u
                JOIN business_profiles AS bp ON bp.user_id = u.id
                WHERE u.id = %s
                """,
                (user_id,),
            )
            row = cursor.fetchone()

    if row is None:
        raise DatabaseDataNotFoundError(
            f"User or business profile not found: {user_id}"
        )
    founded_at = row["founded_at"]
    return {
        "user_id": int(row["user_id"]),
        "age": int(row["age"]) if row["age"] is not None else None,
        "region": row["region"],
        "business": {
            "industry": row["industry"],
            "business_type": row["business_type"],
            "founded_at": founded_at.isoformat() if founded_at else None,
        },
    }


def get_policy(policy_id: int, settings: Settings) -> Policy:
    """PostgreSQL에서 정책과 최신 공고의 신청기간을 조회한다.

    Args:
        policy_id: 조회할 실제 정책 식별자.
        settings: PostgreSQL 연결 설정.

    Returns:
        정책 기본 정보와 최신 공고 신청기간.

    Raises:
        DatabaseDataNotFoundError: 해당 정책이 없을 때.
    """
    with connect_database(settings) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT
                    p.id AS policy_id,
                    p.title,
                    p.region,
                    p.industry,
                    latest.apply_start_date,
                    latest.apply_end_date
                FROM policies AS p
                LEFT JOIN LATERAL (
                    SELECT apply_start_date, apply_end_date
                    FROM announcements
                    WHERE policy_id = p.id
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                ) AS latest ON TRUE
                WHERE p.id = %s
                """,
                (policy_id,),
            )
            row = cursor.fetchone()

    if row is None:
        raise DatabaseDataNotFoundError(f"Policy not found: {policy_id}")
    industry = str(row["industry"] or "").strip()
    return {
        "policy_id": int(row["policy_id"]),
        "title": str(row["title"]),
        "region": str(row["region"] or ""),
        "industry": [industry] if industry else [],
        "apply_start_date": _date_text(row["apply_start_date"]),
        "apply_end_date": _date_text(row["apply_end_date"]),
    }


def get_policy_source_documents(settings: Settings) -> list[RagSourceDocument]:
    """정책과 공고문을 수정하지 않고 RAG 원천 문서로 조회한다.

    Args:
        settings: PostgreSQL 연결 설정.

    Returns:
        정책 ID와 원천 유형이 포함된 정책·공고문 문서 목록.
    """
    with connect_database(settings) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT id, title, region, industry, target, benefit,
                       eligibility_rule, source
                FROM policies
                ORDER BY id
                """
            )
            policy_rows = cursor.fetchall()
            cursor.execute(
                """
                SELECT a.id, a.policy_id, p.title, a.raw_content,
                       a.source_url, a.apply_start_date, a.apply_end_date
                FROM announcements AS a
                JOIN policies AS p ON p.id = a.policy_id
                WHERE NULLIF(BTRIM(a.raw_content), '') IS NOT NULL
                ORDER BY a.id
                """
            )
            announcement_rows = cursor.fetchall()

    return [
        _policy_source_document(row) for row in policy_rows
    ] + [
        _announcement_source_document(row) for row in announcement_rows
    ]


def _policy_source_document(row: Mapping[str, Any]) -> RagSourceDocument:
    """정책 레코드를 검색 가능한 설명 문서로 변환한다."""
    policy_id = int(row["id"])
    return {
        "source_type": "policy",
        "source_id": policy_id,
        "policy_id": policy_id,
        "title": str(row["title"]),
        "source": str(row["source"] or f"db://policies/{policy_id}"),
        "content": _join_labeled_values(
            ("정책명", row["title"]),
            ("지역", row["region"]),
            ("업종", row["industry"]),
            ("지원 대상", row["target"]),
            ("지원 내용", row["benefit"]),
            ("자격 조건", row["eligibility_rule"]),
        ),
    }


def _announcement_source_document(row: Mapping[str, Any]) -> RagSourceDocument:
    """공고문 레코드를 정책 ID가 포함된 검색 문서로 변환한다."""
    announcement_id = int(row["id"])
    return {
        "source_type": "announcement",
        "source_id": announcement_id,
        "policy_id": int(row["policy_id"]),
        "title": str(row["title"]),
        "source": str(
            row["source_url"] or f"db://announcements/{announcement_id}"
        ),
        "content": _join_labeled_values(
            ("정책명", row["title"]),
            ("신청 시작일", row["apply_start_date"]),
            ("신청 종료일", row["apply_end_date"]),
            ("공고 내용", row["raw_content"]),
        ),
    }


def _join_labeled_values(*items: tuple[str, object | None]) -> str:
    """값이 존재하는 DB 필드를 `항목: 값` 형식으로 결합한다."""
    return "\n".join(
        f"{label}: {value}"
        for label, value in items
        if value is not None and str(value).strip()
    )


def _date_text(value: object | None) -> str:
    """선택적 날짜 값을 기존 문자열 계약으로 변환한다."""
    return value.isoformat() if hasattr(value, "isoformat") else str(value or "")
