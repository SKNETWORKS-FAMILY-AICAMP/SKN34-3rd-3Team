"""Postgres + pgvector 연결 상태 확인.

Backend는 Postgres에 쓰지 않는다. LLM이 적재한 벡터 데이터와 수집 스크립트가
넣은 원천 데이터를 건드리지 않기 위해, 여기서는 연결·확장·건수 조회만 한다.
"""

from __future__ import annotations

from urllib.parse import urlparse

from core.config import DATABASE_URL


def _connect():
    try:
        import psycopg
    except ImportError:
        return None
    parsed = urlparse(DATABASE_URL)
    try:
        return psycopg.connect(
            host=parsed.hostname or "127.0.0.1",
            port=parsed.port or 5432,
            user=parsed.username or "admin",
            password=parsed.password or "admin1234",
            dbname=(parsed.path or "/startup_platform").lstrip("/") or "startup_platform",
            connect_timeout=3,
            autocommit=True,
        )
    except Exception:
        return None


def postgres_status() -> dict:
    conn = _connect()
    if conn is None:
        return {"reachable": False, "pgvector": False, "url": DATABASE_URL}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
            has_vector = cur.fetchone() is not None
            cur.execute("SELECT to_regclass('public.users')")
            has_users = cur.fetchone()[0] is not None
            chunk_count = 0
            user_count = 0
            if has_users:
                cur.execute("SELECT COUNT(*) FROM users")
                user_count = int(cur.fetchone()[0])
            if has_vector:
                cur.execute("SELECT to_regclass('public.rag_documents')")
                if cur.fetchone()[0]:
                    cur.execute("SELECT COUNT(*) FROM rag_documents")
                    chunk_count = int(cur.fetchone()[0])
        return {
            "reachable": True,
            "pgvector": bool(has_vector),
            "url": DATABASE_URL,
            "ragChunks": chunk_count,
            "users": user_count,
        }
    except Exception:
        return {"reachable": False, "pgvector": False, "url": DATABASE_URL}
    finally:
        conn.close()
