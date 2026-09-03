from pydantic import SecretStr

from src.core.config import Settings


def test_placeholder_values_are_not_treated_as_configured() -> None:
    settings = Settings(
        _env_file=None,
        llm_model="YOUR_LLM_MODEL",
        embedding_model="YOUR_EMBEDDING_MODEL",
        openai_api_key=SecretStr("YOUR_OPENAI_API_KEY"),
    )

    assert settings.llm_configured is False
    assert settings.embedding_configured is False


def test_openai_configuration_is_detected_without_exposing_secret() -> None:
    settings = Settings(
        _env_file=None,
        llm_model="test-chat-model",
        embedding_model="test-embedding-model",
        openai_api_key=SecretStr("test-secret"),
    )

    assert settings.llm_configured is True
    assert settings.embedding_configured is True
    assert "test-secret" not in repr(settings)


def test_cors_origins_are_parsed_from_comma_separated_setting() -> None:
    settings = Settings(
        _env_file=None,
        cors_origins="http://localhost:5173, http://127.0.0.1:5173",
    )

    assert settings.allowed_cors_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
