#!/bin/bash

echo "🚀 Starting RAG Chatbot Development Environment..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill 0
}
trap cleanup EXIT INT TERM

# Start FastAPI backend
echo "🔧 Starting FastAPI backend on http://localhost:8000..."
cd "$(dirname "$0")/.."
source .venv/Scripts/activate
PYTHONPATH=. python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend on http://localhost:3000..."
cd frontend-react
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "📱 React Frontend: http://localhost:3000"
echo "🔧 FastAPI Backend: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for any process to exit
wait