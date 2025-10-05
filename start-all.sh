#!/bin/bash

# ============================================================================
# Gym Scroller - Full Stack Startup Script
# ============================================================================
# Starts ESP8266, Backend, and Frontend simultaneously
# Usage: ./start-all.sh
# Press Ctrl+C to stop all services
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Process IDs
ESP_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# ============================================================================
# Cleanup function - kills all background processes
# ============================================================================
cleanup() {
    echo -e "\n${YELLOW}⏹️  Shutting down all services...${NC}"

    if [ -n "$ESP_PID" ]; then
        echo -e "${BLUE}🔌 Stopping ESP8266 monitor...${NC}"
        kill $ESP_PID 2>/dev/null || true
    fi

    if [ -n "$BACKEND_PID" ]; then
        echo -e "${BLUE}🐍 Stopping backend server...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ]; then
        echo -e "${BLUE}⚛️  Stopping frontend dev server...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# ============================================================================
# Pre-flight checks
# ============================================================================
echo -e "${BLUE}🔍 Running pre-flight checks...${NC}"

# Check if platformio is installed
if ! command -v platformio &> /dev/null; then
    echo -e "${RED}❌ PlatformIO not found. Please install it first.${NC}"
    exit 1
fi

# Check if python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python not found. Please install Python 3.x${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js and npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required tools found${NC}\n"

# ============================================================================
# 1. ESP8266 Build, Upload, and Monitor
# ============================================================================
echo -e "${BLUE}🔌 Starting ESP8266...${NC}"

if [ ! -d "esp8266 mpu6050" ]; then
    echo -e "${RED}❌ ESP8266 directory not found${NC}"
    exit 1
fi

cd "esp8266 mpu6050"

echo -e "${YELLOW}📦 Building ESP8266 firmware...${NC}"
platformio run

echo -e "${YELLOW}⬆️  Uploading to ESP8266...${NC}"
platformio run --target upload

echo -e "${YELLOW}📡 Starting serial monitor...${NC}"
platformio device monitor &
ESP_PID=$!

cd ..

echo -e "${GREEN}✅ ESP8266 running (PID: $ESP_PID)${NC}\n"

# Give ESP8266 time to start
sleep 2

# ============================================================================
# 2. Backend Python Server
# ============================================================================
echo -e "${BLUE}🐍 Starting backend server...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi

cd backend

# Activate virtual environment (try both Windows and Unix paths)
if [ -f "venv/Scripts/activate" ]; then
    echo -e "${YELLOW}Activating virtual environment (Windows)...${NC}"
    source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
    echo -e "${YELLOW}Activating virtual environment (Unix)...${NC}"
    source venv/bin/activate
else
    echo -e "${RED}❌ Virtual environment not found. Please run: python -m venv venv${NC}"
    exit 1
fi

# Determine python command
PYTHON_CMD="python"
if ! command -v python &> /dev/null; then
    PYTHON_CMD="python3"
fi

echo -e "${YELLOW}🚀 Starting FastAPI server...${NC}"
$PYTHON_CMD src/main.py &
BACKEND_PID=$!

cd ..

echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}\n"

# Give backend time to start
sleep 3

# ============================================================================
# 3. Frontend Dev Server
# ============================================================================
echo -e "${BLUE}⚛️  Starting frontend dev server...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found${NC}"
    exit 1
fi

cd frontend

echo -e "${YELLOW}📦 Starting Next.js dev server...${NC}"
npm run dev &
FRONTEND_PID=$!

cd ..

echo -e "${GREEN}✅ Frontend running (PID: $FRONTEND_PID)${NC}\n"

# ============================================================================
# Status Summary
# ============================================================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 Gym Scroller is now running!                          ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  🔌 ESP8266:  Serial monitor active                       ║${NC}"
echo -e "${GREEN}║  🐍 Backend:  http://localhost:8000                       ║${NC}"
echo -e "${GREEN}║  ⚛️  Frontend: http://localhost:3000                       ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Keep script running and wait for Ctrl+C
wait
