from __future__ import annotations

import os
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from .config import settings


def _ensure_key():
    # Ensure GOOGLE_API_KEY set for client
    settings.ensure_google_key_env()
    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError(
            "Missing GOOGLE_API_KEY or GEMMI_API_KEY in environment/.env"
        )


def get_chat_model(temperature: float = 0.2) -> ChatGoogleGenerativeAI:
    _ensure_key()
    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        temperature=temperature,
    )


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    _ensure_key()
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model
    )
