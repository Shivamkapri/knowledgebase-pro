from __future__ import annotations

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("")
async def ingest():
    """
    Web uploads/ingestion have been disabled.

    To ingest documents, place PDF files into `data/uploads` and run the
    local ingestion helper script: `scripts/ingest_from_uploads.py`.
    """
    raise HTTPException(
        status_code=403,
        detail=(
            "Web ingestion is disabled. Place PDFs into data/uploads and run "
            "scripts/ingest_from_uploads.py on the server or locally to rebuild the vector store."
        ),
    )
