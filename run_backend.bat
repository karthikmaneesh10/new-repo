@echo off
cd /d "%~dp0backend"
echo ========================================================
echo   Starting NovelNest FastAPI Backend Server (Port 8000)
echo ========================================================
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
