from pydantic_settings import BaseSettings
from typing import Optional, Literal
import os
from pathlib import Path

AIProvider = Literal["openai", "deepseek", "ollama"]

class Settings(BaseSettings):
    """Application settings"""

    # AI Provider
    ai_provider: AIProvider = "openai"
    default_model: str = "gpt-4"

    # OpenAI
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4"

    # DeepSeek
    deepseek_api_key: str = ""
    deepseek_api_base: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"

    # Ollama
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3"

    # Database
    database_url: str = "sqlite:///./novel_companion.db"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Upload
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "allow"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        Path(self.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)

    @property
    def current_api_key(self) -> str:
        if self.ai_provider == "deepseek":
            return self.deepseek_api_key or self.openai_api_key
        elif self.ai_provider == "ollama":
            return "ollama"  # Ollama doesn't need an API key
        return self.openai_api_key

    @property
    def current_api_base(self) -> str:
        if self.ai_provider == "deepseek":
            return self.deepseek_api_base
        elif self.ai_provider == "ollama":
            return self.ollama_base_url
        return self.openai_api_base

    @property
    def current_model(self) -> str:
        if self.default_model and self.default_model != "gpt-4":
            return self.default_model
        if self.ai_provider == "deepseek":
            return self.deepseek_model
        elif self.ai_provider == "ollama":
            return self.ollama_model
        return self.openai_model

    @property
    def is_cloud_provider(self) -> bool:
        return self.ai_provider in ("openai", "deepseek")

settings = Settings()
