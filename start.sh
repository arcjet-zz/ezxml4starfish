#!/bin/bash

echo "Starting Starfish-ezxml Development Environment"
echo "============================================="

# 检查Python和Node.js
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: Node.js/npm is not installed"
    exit 1
fi

echo ""
echo "Starting Backend (FastAPI)..."
cd backend

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
if [ ! -f "venv/installed" ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# 启动后端
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo ""
echo "Waiting for backend to start..."
sleep 3

echo ""
echo "Starting Frontend (React)..."
cd ../frontend

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# 启动前端
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

# 等待用户中断
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
