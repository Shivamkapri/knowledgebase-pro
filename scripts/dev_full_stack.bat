@echo off
echo 🚀 Starting RAG Chatbot Development Environment...

cd /d "%~dp0.."

echo 🔧 Starting FastAPI backend on http://localhost:8000...
call .venv\Scripts\activate.bat
start "FastAPI Backend" cmd /k "set PYTHONPATH=. && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo ⚛️  Starting React frontend on http://localhost:3000...
cd frontend-react
start "React Frontend" cmd /k "npm run dev"

echo.
echo ✅ Development servers started!
echo 📱 React Frontend: http://localhost:3000
echo 🔧 FastAPI Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo Close both command windows to stop the servers.
pause