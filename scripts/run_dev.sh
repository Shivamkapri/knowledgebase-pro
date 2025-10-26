#!/usr/bin/env bash
set -euo pipefail

# Simple dev helper for bash (Windows Git Bash / WSL)
# Usage: ./scripts/run_dev.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# create venv if missing
if [ ! -d ".venv" ]; then
  python -m venv .venv
fi

# activate
source .venv/Scripts/activate

pip install --upgrade pip
pip install -r requirements.txt

echo "Ingesting PDFs from data/uploads (this will remove and rebuild chroma_db)..."
PYTHONPATH=. .venv/Scripts/python.exe scripts/ingest_from_uploads.py

echo "Starting uvicorn (http://127.0.0.1:8000)"
PYTHONPATH=. .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
