#!/usr/bin/env python3
from __future__ import annotations

import shutil
import sys
from pathlib import Path
from typing import List

from app.ingest import ingest_file_paths
from app.config import settings


def find_pdfs_in_uploads(upload_dir: Path) -> List[str]:
    return [str(p) for p in upload_dir.rglob("*.pdf")]


def main():
    project_root = Path(__file__).resolve().parent.parent
    uploads_dir = project_root / "data" / "uploads"
    if not uploads_dir.exists():
        print(f"Uploads directory not found: {uploads_dir}")
        sys.exit(1)

    pdfs = find_pdfs_in_uploads(uploads_dir)
    if not pdfs:
        print("No PDF files found in data/uploads. Nothing to ingest.")
        sys.exit(0)

    vs_dir = Path(settings.vector_store_dir)
    if vs_dir.exists():
        print(f"Removing existing vector store directory: {vs_dir}")
        shutil.rmtree(vs_dir)

    print(f"Ingesting {len(pdfs)} PDF(s) from {uploads_dir} into vector store {vs_dir}...")
    try:
        docs_count, chunks_count = ingest_file_paths(pdfs)
        print(f"Ingestion complete: {docs_count} documents, {chunks_count} chunks.")
    except Exception as e:
        print(f"Error during ingestion: {e}")
        sys.exit(2)


if __name__ == "__main__":
    main()
