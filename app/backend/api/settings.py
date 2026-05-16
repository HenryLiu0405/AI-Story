from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List

from app.core.config import settings
from app.services.ai_service import ai_service

router = APIRouter(tags=["settings"])


# --- Request / Response schemas ---

class AIModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    is_local: bool

class SettingsModelsResponse(BaseModel):
    models: List[AIModelInfo]
    current_provider: str
    current_model: str

class TestConnectionRequest(BaseModel):
    provider: str
    api_key: str
    base_url: str
    model: str

class TestConnectionResponse(BaseModel):
    success: bool
    message: str

class ProviderStatus(BaseModel):
    provider: str
    is_configured: bool
    is_local: bool
    model: str


# --- Endpoints ---

@router.get("/api/settings/models", response_model=SettingsModelsResponse)
def get_available_models():
    """Return available models grouped by provider, plus current config."""
    models: List[AIModelInfo] = [
        # OpenAI
        AIModelInfo(id="gpt-4", name="GPT-4", provider="openai", is_local=False),
        AIModelInfo(id="gpt-4o", name="GPT-4o", provider="openai", is_local=False),
        AIModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", provider="openai", is_local=False),
        # DeepSeek
        AIModelInfo(id="deepseek-chat", name="DeepSeek Chat", provider="deepseek", is_local=False),
        AIModelInfo(id="deepseek-reasoner", name="DeepSeek Reasoner", provider="deepseek", is_local=False),
        # Ollama (common models; user can override)
        AIModelInfo(id="llama3", name="Llama 3", provider="ollama", is_local=True),
        AIModelInfo(id="mistral", name="Mistral", provider="ollama", is_local=True),
        AIModelInfo(id="qwen2.5", name="Qwen 2.5", provider="ollama", is_local=True),
    ]
    return SettingsModelsResponse(
        models=models,
        current_provider=settings.ai_provider,
        current_model=settings.current_model,
    )


@router.post("/api/settings/models/test", response_model=TestConnectionResponse)
def test_connection(req: TestConnectionRequest):
    """Test connectivity to a given provider/model combination."""
    result = ai_service.test_connection(
        provider=req.provider,
        api_key=req.api_key,
        base_url=req.base_url,
        model=req.model,
    )
    return TestConnectionResponse(
        success=result["success"] == "true",
        message=result["message"],
    )


@router.get("/api/settings/provider-status", response_model=ProviderStatus)
def get_provider_status():
    """Return current provider status (does NOT expose API keys)."""
    return ProviderStatus(
        provider=settings.ai_provider,
        is_configured=ai_service.is_configured(),
        is_local=ai_service.is_local,
        model=settings.current_model,
    )
