from __future__ import annotations

from typing import Optional

from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings

from .config import settings


def get_vector_store(embeddings: Embeddings, create: bool = True) -> Chroma:
    # Chroma creates the store if not present; persistent dir ensures data survives restarts
    return Chroma(
        collection_name=settings.collection_name,
        embedding_function=embeddings,
        persist_directory=settings.vector_store_dir,
    )


def get_retriever(embeddings: Embeddings, k: int = 4):
    vs = get_vector_store(embeddings)
    return vs.as_retriever(search_kwargs={"k": k})
