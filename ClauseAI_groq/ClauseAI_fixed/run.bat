@echo off
title ClauseAI Launcher
color 0b
echo ========================================
echo        Starting ClauseAI Assistant...
echo ========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo ==============================================================
    echo [CRITICAL ERROR] Python is not installed or not in PATH!
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation!
    echo ==============================================================
    pause
    exit /b
)

echo [*] Installing dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt -q
echo [*] Dependencies installed!

echo [*] Starting ClauseAI Backend...
start "ClauseAI Backend Server" cmd /k "title ClauseAI Backend Server && color 0a && python app.py"

echo [*] Starting Frontend Web Server...
cd /d "%~dp0frontend"
start "ClauseAI Frontend Server" cmd /k "title ClauseAI Web Server && color 0d && python -m http.server 8080"

echo [*] Opening Browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:8080

echo.
echo ========================================
echo    ClauseAI is now running!
echo    Close this window anytime.
echo ========================================
timeout /t 5 /nobreak >nul
