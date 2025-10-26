from __future__ import annotations

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API keys: support user's GEMMI_API_KEY naming or standard GOOGLE_API_KEY
    gemmi_api_key: Optional[str] = Field(default=None, alias="GEMMI_API_KEY")
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")
    # Also accept GEMINI_API_KEY to avoid confusion
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")

    # Models
    # Using gemini-2.0-flash (stable, widely available). Override via env LLM_MODEL
    llm_model: str = Field(default=os.getenv("LLM_MODEL", "gemini-2.0-flash"), alias="LLM_MODEL")
    embedding_model: str = Field(default=os.getenv("EMBEDDING_MODEL", "text-embedding-004"), alias="EMBEDDING_MODEL")

    # Vector store
    vector_store_dir: str = Field(default=os.getenv("VECTOR_STORE_DIR", "./chroma_db"), alias="VECTOR_STORE_DIR")
    collection_name: str = Field(default=os.getenv("COLLECTION_NAME", "rag_docs"), alias="COLLECTION_NAME")

    # CORS / server
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def ensure_google_key_env(self) -> None:
        """
        Ensure the GOOGLE_API_KEY env var is set for langchain-google-genai client.
        We accept either GEMMI_API_KEY or GOOGLE_API_KEY from the user and map accordingly.
        """
        # Prefer configured settings, but also fall back to current process env vars
        key = (
            self.google_api_key
            or self.gemmi_api_key
            or self.gemini_api_key
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMMI_API_KEY")
            or os.getenv("GEMINI_API_KEY")
        )
        if key and not os.getenv("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = key


settings = Settings()