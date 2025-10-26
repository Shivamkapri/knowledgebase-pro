from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int = Field(default=4, ge=1, le=20)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    model: Optional[str] = None  # Optional override for the chat model


class SourceItem(BaseModel):
    id: Optional[str] = None
    score: Optional[float] = None
    source: Optional[str] = None
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem] = []
