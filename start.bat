@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

echo Starting Starfish-ezxml Development Environment
echo =============================================

where python >nul 2>nul
if errorlevel 1 (
    echo Error: Python is not installed or not on PATH.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js/npm is not installed or not on PATH.
    exit /b 1
)

if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
    echo Creating backend virtual environment...
    python -m venv "%BACKEND_DIR%\.venv"
    if errorlevel 1 exit /b 1
)

echo Installing backend dependencies...
"%BACKEND_DIR%\.venv\Scripts\python.exe" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 exit /b 1

if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    npm --prefix "%FRONTEND_DIR%" install
    if errorlevel 1 exit /b 1
)

echo Starting Backend (FastAPI)...
start "EzXML Backend" /D "%BACKEND_DIR%" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React)...
start "EzXML Frontend" /D "%FRONTEND_DIR%" cmd /k "npm start"

echo.
echo =============================================
echo Services starting:
echo - Backend API: http://localhost:8000
echo - Frontend App: http://localhost:3000
echo - API Docs: http://localhost:8000/docs
echo =============================================
echo.
echo Close the backend/frontend windows to stop the services.
pause
