import os
from dataclasses import dataclass

from langsmith import Client

from src.core.config import Settings


class LangSmithConfigurationError(RuntimeError):
    """Raised when tracing is enabled without all required settings."""


@dataclass(frozen=True, slots=True)
class LangSmithRuntime:
    enabled: bool
    project_name: str
    client: Client | None = None


def configure_langsmith(settings: Settings) -> LangSmithRuntime:
    """Configure tracing without making a network request or logging secrets."""
    if not settings.langsmith_tracing:
        os.environ["LANGSMITH_TRACING"] = "false"
        return LangSmithRuntime(enabled=False, project_name=settings.langsmith_project)

    if not settings.langsmith_configured or settings.langsmith_api_key is None:
        raise LangSmithConfigurationError(
            "LangSmith tracing is enabled but LANGSMITH_API_KEY, "
            "LANGSMITH_ENDPOINT, or LANGSMITH_PROJECT is missing."
        )

    api_key = settings.langsmith_api_key.get_secret_value()
    os.environ.update(
        {
            "LANGSMITH_TRACING": "true",
            "LANGSMITH_ENDPOINT": settings.langsmith_endpoint,
            "LANGSMITH_PROJECT": settings.langsmith_project,
            "LANGSMITH_API_KEY": api_key,
            "LANGSMITH_HIDE_INPUTS": str(settings.langsmith_hide_inputs).lower(),
            "LANGSMITH_HIDE_OUTPUTS": str(settings.langsmith_hide_outputs).lower(),
        }
    )
    client = Client(
        api_url=settings.langsmith_endpoint,
        api_key=api_key,
        hide_inputs=settings.langsmith_hide_inputs,
        hide_outputs=settings.langsmith_hide_outputs,
    )
    return LangSmithRuntime(
        enabled=True,
        project_name=settings.langsmith_project,
        client=client,
    )
