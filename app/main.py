from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routes import chat as chat_routes
from .routes import ingest as ingest_routes
from .routes import chats as chats_routes

app = FastAPI(title="RAG Chatbot (LangChain + Gemini)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(ingest_routes.router)
app.include_router(chat_routes.router)
app.include_router(chats_routes.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend (React build or fallback to simple frontend)
REACT_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend-react" / "dist"
SIMPLE_FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if REACT_DIST_DIR.exists():
    # Serve React production build
    app.mount("/", StaticFiles(directory=str(REACT_DIST_DIR), html=True), name="react-frontend")
elif SIMPLE_FRONTEND_DIR.exists():
    # Fallback to simple frontend
    app.mount("/", StaticFiles(directory=str(SIMPLE_FRONTEND_DIR), html=True), name="simple-frontend")
