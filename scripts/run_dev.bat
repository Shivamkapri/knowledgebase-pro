@echo off
REM Simple Windows helper (run from repo root): scripts\run_dev.bat

IF NOT EXIST ".venv\Scripts\python.exe" (
  python -m venv .venv
)

.venv\Scripts\activate

echo Installing dependencies...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt

echo Ingesting PDFs from data\uploads (this will remove and rebuild chroma_db)...
SET PYTHONPATH=.
.venv\Scripts\python.exe scripts\ingest_from_uploads.py

echo Starting uvicorn on http://127.0.0.1:8000
SET PYTHONPATH=.
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
