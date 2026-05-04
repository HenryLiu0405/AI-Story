from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # AI API
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4"
    
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

settings = Settings()
