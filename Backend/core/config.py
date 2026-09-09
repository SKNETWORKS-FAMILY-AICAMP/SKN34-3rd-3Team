"""공통 설정. 저장소 루트의 .env 를 읽는다."""

import os

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv(usecwd=True) or None)


class Settings:
    # DB (docker-compose 의 db 서비스)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("POSTGRES_DB", "startup_platform")
    DB_USER: str = os.getenv("POSTGRES_USER", "admin")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "admin1234")

    # 내부 LLM 서비스 (Docker 네트워크에서는 http://llm:8001)
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "http://localhost:8001")

    # Frontend(Vite) 개발 서버
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    @property
    def dsn(self) -> dict:
        return {
            "host": self.DB_HOST,
            "port": self.DB_PORT,
            "dbname": self.DB_NAME,
            "user": self.DB_USER,
            "password": self.DB_PASSWORD,
        }


settings = Settings()
