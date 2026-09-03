from typing import Literal

from pydantic import BaseModel


ComponentState = Literal["configured", "not_configured", "mock"]


class ComponentConfiguration(BaseModel):
    llm: ComponentState
    embedding: ComponentState
    data_source: ComponentState


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str
    version: str
    components: ComponentConfiguration
