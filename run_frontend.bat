@echo off
cd /d "%~dp0frontend"
echo ========================================================
echo   Starting NovelNest React Frontend Client (Port 3000)
echo ========================================================
call npm.cmd run dev
pause
