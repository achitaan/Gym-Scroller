@echo off
REM ============================================================================
REM Gym Scroller - Full Stack Startup Script (Windows)
REM ============================================================================
REM Starts ESP8266, Backend, and Frontend in separate windows
REM Usage: start-all.bat
REM Close each window individually to stop services
REM ============================================================================

title Gym Scroller - Launcher

echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 Starting Gym Scroller - Full Stack                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM Pre-flight checks
REM ============================================================================
echo 🔍 Running pre-flight checks...
echo.

REM Check if PlatformIO is installed
where platformio >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PlatformIO not found. Please install it first.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python 3.x
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install Node.js and npm
    pause
    exit /b 1
)

echo ✅ All required tools found
echo.

REM ============================================================================
REM 1. ESP8266 Build, Upload, and Monitor
REM ============================================================================
echo 🔌 Starting ESP8266 in new window...

if not exist "esp8266 mpu6050" (
    echo ❌ ESP8266 directory not found
    pause
    exit /b 1
)

start "ESP8266 - Gym Scroller" cmd /k "cd /d "%~dp0esp8266 mpu6050" && echo 📦 Building firmware... && platformio run && echo ⬆️ Uploading... && platformio run --target upload && echo 📡 Serial Monitor && platformio device monitor"

echo ✅ ESP8266 window opened
echo.

REM Give ESP8266 time to start
timeout /t 3 /nobreak >nul

REM ============================================================================
REM 2. Backend Python Server
REM ============================================================================
echo 🐍 Starting backend server in new window...

if not exist "backend" (
    echo ❌ Backend directory not found
    pause
    exit /b 1
)

start "Backend - Gym Scroller" cmd /k "cd /d "%~dp0backend" && echo Activating virtual environment... && call venv\Scripts\activate.bat && echo 🚀 Starting FastAPI server... && python src\main.py"

echo ✅ Backend window opened
echo.

REM Give backend time to start
timeout /t 3 /nobreak >nul

REM ============================================================================
REM 3. Frontend Dev Server
REM ============================================================================
echo ⚛️ Starting frontend dev server in new window...

if not exist "frontend" (
    echo ❌ Frontend directory not found
    pause
    exit /b 1
)

start "Frontend - Gym Scroller" cmd /k "cd /d "%~dp0frontend" && echo 📦 Starting Next.js dev server... && npm run dev"

echo ✅ Frontend window opened
echo.

REM ============================================================================
REM Status Summary
REM ============================================================================
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🎉 Gym Scroller is now running!                          ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  🔌 ESP8266:  Check "ESP8266 - Gym Scroller" window       ║
echo ║  🐍 Backend:  http://localhost:8000                       ║
echo ║              Check "Backend - Gym Scroller" window       ║
echo ║  ⚛️  Frontend: http://localhost:3000                       ║
echo ║              Check "Frontend - Gym Scroller" window      ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  Close each window individually to stop services          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Press any key to close this launcher window...
pause >nul
