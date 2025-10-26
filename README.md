add a safe “fallback to internet” behavior  addedno

Short setup & run

1) Create & activate venv

```bash
python -m venv .venv
source .venv/Scripts/activate
```

2) Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

3) Configure secrets in `.env` (DO NOT commit this file)

```text
MONGODB_URI=your-mongodb-uri
GOOGLE_API_KEY=your-google-or-gemini-key
# or GEMMI_API_KEY / GEMINI_API_KEY
```

4) Ingest PDFs from `data/uploads` into Chroma (this will remove and rebuild `chroma_db`)

```bash
PYTHONPATH=. .venv/Scripts/python.exe scripts/ingest_from_uploads.py
```

5) Start the app

```bash
PYTHONPATH=. .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

6) Open UI: http://127.0.0.1:8000

Helpful: there are convenience scripts in `scripts/` to automate these steps (`run_dev.sh` and `run_dev.bat`).
# RAG Chatbot (LangChain + Gemini)

Backend-first Retrieval-Augmented Generation (RAG) chatbot using LangChain, FastAPI, and Chroma, powered by Google Gemini (you can set the key in `GEMMI_API_KEY` or `GOOGLE_API_KEY`). A minimal frontend is included for testing.

## Features
- Ingest local files (PDF, TXT) via `/ingest` (multipart upload)
- Store embeddings in Chroma (local persistent directory)
- Query with `/chat` using retrieved context
- Configurable via environment variables
- Minimal static frontend for quick testing

## Quickstart

1. Create and activate a virtual environment (Windows bash):

```bash
python -m venv .venv
source .venv/Scripts/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

- Copy `.env.example` to `.env` and set your key in `GEMMI_API_KEY` (or `GOOGLE_API_KEY`).

4. Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

5. Open the test UI:

- Navigate to `http://localhost:8000` for the minimal chat UI.
- API docs are at `http://localhost:8000/docs`.

## Endpoints
- `GET /health` – service health check
- `POST /ingest` – upload PDF/TXT files to index
- `POST /chat` – ask a question `{ "question": "...", "top_k": 4 }`

## Environment variables
- `GEMMI_API_KEY` (or `GOOGLE_API_KEY`): Gemini API key
- `VECTOR_STORE_DIR` (default: `./chroma_db`): Chroma persistence dir
- `LLM_MODEL` (default: `gemini-1.5-flash`)
- `EMBEDDING_MODEL` (default: `text-embedding-004`)

## Notes
- For production, consider a managed vector DB (e.g., Pinecone/Weaviate), auth, and rate-limiters.
- Ensure you use the same embedding model for ingestion and query.
- If you need to support more file types, add loaders to `app/ingest.py`.





!!!!!!<br> <h> to run the code </h>

Git Bash / WSL 
source .venv/Scripts/activate

Ingest (rebuild vector store):
PYTHONPATH=. .venv/Scripts/python.exe scripts/ingest_from_uploads.py

Start server:
PYTHONPATH=. .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000















CTRL+C

PYTHONPATH=. .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload