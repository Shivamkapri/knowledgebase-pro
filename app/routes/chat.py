from __future__ import annotations

from typing import List

import os
from fastapi import APIRouter, HTTPException

from ..models import ChatRequest, ChatResponse, SourceItem
from ..llm import get_chat_model, get_embeddings
from ..vector_store import get_vector_store
from ..config import settings

router = APIRouter(prefix="/chat", tags=["chat"])


SYSTEM_INSTRUCTION = (
    "You are a helpful assistant. Answer the user's question using the provided context. "
    "If the answer isn't in the context, say you don't know. Keep answers concise and cite sources when possible."
)


def _format_context(docs) -> str:
    blocks = []
    for i, d in enumerate(docs, start=1):
        src = d.metadata.get("source") if hasattr(d, "metadata") else None
        blocks.append(f"[Source {i}: {src}]\n{d.page_content}")
    return "\n\n".join(blocks)


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    try:
        # Pre-check API key for clearer error than a 500
        settings.ensure_google_key_env()
        if not os.getenv("GOOGLE_API_KEY"):
            raise HTTPException(status_code=401, detail="Missing GOOGLE_API_KEY or GEMMI_API_KEY/GEMINI_API_KEY in environment/.env")
        embeddings = get_embeddings()
        vs = get_vector_store(embeddings)
        retriever = vs.as_retriever(search_kwargs={"k": payload.top_k})

        # In newer LangChain, retrievers are Runnables; use invoke() to get documents
        docs = retriever.invoke(payload.question)
        if not docs:
            raise HTTPException(status_code=404, detail="No data found in the knowledge base. Please ingest documents first.")

        context = _format_context(docs)
        prompt = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {payload.question}\n"
            f"Answer:"
        )

        llm = get_chat_model(temperature=payload.temperature)
        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, "content") else str(response)

        sources: List[SourceItem] = []
        for i, d in enumerate(docs, start=1):
            sources.append(
                SourceItem(
                    id=str(i),
                    score=d.metadata.get("score") if hasattr(d, "metadata") else None,
                    source=d.metadata.get("source") if hasattr(d, "metadata") else None,
                    content=d.page_content,
                )
            )

        return ChatResponse(answer=answer, sources=sources)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
