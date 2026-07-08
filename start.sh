#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

echo "Starting Starfish-ezxml Development Environment"
echo "============================================="

command -v python3 >/dev/null 2>&1 || {
  echo "Error: python3 is not installed or not on PATH"
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "Error: Node.js/npm is not installed or not on PATH"
  exit 1
}

cd "$BACKEND_DIR"
if [ ! -x ".venv/bin/python" ]; then
  echo "Creating backend virtual environment..."
  python3 -m venv .venv
fi

echo "Installing backend dependencies..."
.venv/bin/python -m pip install -r requirements.txt

echo "Starting Backend (FastAPI)..."
.venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 3

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting Frontend (React)..."
npm start &
FRONTEND_PID=$!

echo ""
echo "============================================="
echo "Services started:"
echo "- Backend API: http://localhost:8000"
echo "- Frontend App: http://localhost:3000"
echo "- API Docs: http://localhost:8000/docs"
echo "============================================="
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
