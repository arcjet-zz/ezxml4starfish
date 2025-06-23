@echo off
echo Starting Starfish-ezxml Development Environment
echo =============================================

echo.
echo Checking dependencies...

echo.
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt

echo.
echo Starting Backend (FastAPI)...
start "Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Checking Node.js dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

echo.
echo Starting Frontend (React)...
start "Frontend" cmd /k "npm start"

echo.
echo =============================================
echo Services starting:
echo - Backend API: http://localhost:8000
echo - Frontend App: http://localhost:3000
echo - API Docs: http://localhost:8000/docs
echo =============================================
echo.
echo Both services are starting in separate windows.
echo Close those windows to stop the services.
echo.
echo Press any key to exit this window...
pause > nul
