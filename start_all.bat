@echo off
cd /d "%~dp0"
echo ========================================================
echo   Launching NovelNest Full-Stack Localhost Application
echo ========================================================
echo [1/2] Launching FastAPI Backend on http://localhost:8000
start "NovelNest Backend" cmd /c "%~dp0run_backend.bat"

echo [2/2] Launching React Frontend on http://localhost:3000
start "NovelNest Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers are launching!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Website: http://localhost:3000
echo ========================================================
