from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_DIR = Path(__file__).resolve().parents[2]


def _has_real_value(value: str | SecretStr | None) -> bool:
    if isinstance(value, SecretStr):
        value = value.get_secret_value()
    if value is None:
        return False

    normalized = value.strip()
    return bool(normalized) and not normalized.upper().startswith("YOUR_")


class Settings(BaseSettings):
    """Environment-backed settings with no embedded credentials or model IDs."""

    app_name: str = "policy-rag-llm"
    app_env: str = "local"
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"

    llm_model: str = ""
    embedding_model: str = ""
    openai_api_key: SecretStr | None = None

    model_config = SettingsConfigDict(
        env_file=PROJECT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def llm_configured(self) -> bool:
        return _has_real_value(self.llm_model) and _has_real_value(
            self.openai_api_key
        )

    @property
    def embedding_configured(self) -> bool:
        return _has_real_value(self.embedding_model) and _has_real_value(
            self.openai_api_key
        )

    @property
    def allowed_cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
