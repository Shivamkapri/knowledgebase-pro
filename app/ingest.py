from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import Iterable, List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document

from .llm import get_embeddings
from .vector_store import get_vector_store
from .config import settings


SUPPORTED_EXTS = {".pdf", ".txt"}


def _loader_for(path: Path):
    if path.suffix.lower() == ".pdf":
        return PyPDFLoader(str(path))
    return TextLoader(str(path), encoding="utf-8")


def _load_documents(paths: List[Path]) -> List[Document]:
    docs: List[Document] = []
    for p in paths:
        loader = _loader_for(p)
        loaded = loader.load()
        # add source metadata
        for d in loaded:
            d.metadata = {**d.metadata, "source": str(p)}
        docs.extend(loaded)
    return docs


def _split_documents(docs: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def ingest_file_paths(file_paths: Iterable[str]) -> Tuple[int, int]:
    paths = [Path(p) for p in file_paths]
    for p in paths:
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p}")
        if p.suffix.lower() not in SUPPORTED_EXTS:
            raise ValueError(f"Unsupported file type: {p.suffix}")

    docs = _load_documents(paths)
    chunks = _split_documents(docs)

    embeddings = get_embeddings()
    vs = get_vector_store(embeddings)
    vs.add_documents(chunks)
    vs.persist()

    return len(docs), len(chunks)


def save_uploads_to_temp(upload_dir: str, upload_items) -> List[str]:
    os.makedirs(upload_dir, exist_ok=True)
    saved_paths: List[str] = []
    for item in upload_items:
        ext = os.path.splitext(item.filename)[1].lower()
        if ext not in SUPPORTED_EXTS:
            continue
        fname = f"{uuid.uuid4().hex}{ext}"
        fpath = os.path.join(upload_dir, fname)
        with open(fpath, "wb") as f:
            shutil.copyfileobj(item.file, f)
        saved_paths.append(fpath)
    return saved_paths
