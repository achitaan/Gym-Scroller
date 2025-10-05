#!/bin/bash

# ============================================================================
# Gym Scroller - Prerequisites Checker
# ============================================================================
# Checks if all required tools and dependencies are installed
# Usage: ./check-prerequisites.sh
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Gym Scroller - Prerequisites Check${NC}\n"

ERRORS=0

# ============================================================================
# Check Tools
# ============================================================================
echo -e "${YELLOW}Checking required tools...${NC}"

# Check PlatformIO
if command -v platformio &> /dev/null; then
    VERSION=$(platformio --version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ PlatformIO: $VERSION${NC}"
else
    echo -e "${RED}❌ PlatformIO: Not found${NC}"
    echo -e "   Install: https://platformio.org/install/cli"
    ERRORS=$((ERRORS + 1))
fi

# Check Python
if command -v python &> /dev/null; then
    VERSION=$(python --version)
    echo -e "${GREEN}✅ Python: $VERSION${NC}"
elif command -v python3 &> /dev/null; then
    VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python: $VERSION${NC}"
else
    echo -e "${RED}❌ Python: Not found${NC}"
    echo -e "   Install: https://www.python.org/downloads/"
    ERRORS=$((ERRORS + 1))
fi

# Check Node.js
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $VERSION${NC}"
else
    echo -e "${RED}❌ Node.js: Not found${NC}"
    echo -e "   Install: https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: v$VERSION${NC}"
else
    echo -e "${RED}❌ npm: Not found${NC}"
    echo -e "   Install: Comes with Node.js"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# Check Project Structure
# ============================================================================
echo -e "${YELLOW}Checking project structure...${NC}"

# Check ESP8266 directory
if [ -d "esp8266 mpu6050" ]; then
    echo -e "${GREEN}✅ ESP8266 directory exists${NC}"
else
    echo -e "${RED}❌ ESP8266 directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check backend directory
if [ -d "backend" ]; then
    echo -e "${GREEN}✅ Backend directory exists${NC}"
else
    echo -e "${RED}❌ Backend directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check frontend directory
if [ -d "frontend" ]; then
    echo -e "${GREEN}✅ Frontend directory exists${NC}"
else
    echo -e "${RED}❌ Frontend directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# Check Dependencies
# ============================================================================
echo -e "${YELLOW}Checking dependencies...${NC}"

# Check backend venv
if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✅ Backend virtual environment exists${NC}"
else
    echo -e "${RED}❌ Backend virtual environment not found${NC}"
    echo -e "   Run: cd backend && python -m venv venv"
    ERRORS=$((ERRORS + 1))
fi

# Check backend requirements
if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✅ Backend requirements.txt exists${NC}"
else
    echo -e "${YELLOW}⚠️  Backend requirements.txt not found${NC}"
fi

# Check frontend node_modules
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend node_modules exists${NC}"
else
    echo -e "${RED}❌ Frontend node_modules not found${NC}"
    echo -e "   Run: cd frontend && npm install"
    ERRORS=$((ERRORS + 1))
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json exists${NC}"
else
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ All prerequisites met!                                 ║${NC}"
    echo -e "${GREEN}║  You're ready to run ./start-all.sh                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ $ERRORS issue(s) found                                     ║${NC}"
    echo -e "${RED}║  Please fix the issues above before running start-all.sh  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
