# 🚀 Gym Scroller - Startup Guide

This guide explains how to start all components of the Gym Scroller project at once.

## Quick Start

### Option 1: Git Bash / WSL / Linux / Mac

```bash
# Make script executable (first time only)
chmod +x start-all.sh

# Run the script
./start-all.sh
```

**To stop all services:** Press `Ctrl+C`

---

### Option 2: Windows Command Prompt / PowerShell

```cmd
start-all.bat
```

**To stop services:** Close each window individually

---

## What Gets Started

The startup scripts launch three components:

### 1. 🔌 ESP8266 Microcontroller
- **Location:** `esp8266 mpu6050/`
- **Actions:**
  - Builds the firmware
  - Uploads to ESP8266
  - Opens serial monitor
- **Output:** Real-time sensor data and connection status

### 2. 🐍 Backend Server
- **Location:** `backend/`
- **URL:** http://localhost:8000
- **Actions:**
  - Activates Python virtual environment
  - Starts FastAPI server
- **Output:** WebSocket connections, sensor data processing

### 3. ⚛️ Frontend Dev Server
- **Location:** `frontend/`
- **URL:** http://localhost:3000
- **Actions:**
  - Starts Next.js development server
- **Output:** Web interface for the app

---

## Prerequisites

Before running the startup scripts, ensure you have:

- ✅ **PlatformIO** installed and in PATH
- ✅ **Python 3.x** installed
- ✅ **Python virtual environment** set up: `python -m venv backend/venv`
- ✅ **Node.js and npm** installed
- ✅ **ESP8266** connected via USB

---

## Troubleshooting

### Script won't run (Git Bash)
```bash
# Make sure the script is executable
chmod +x start-all.sh
```

### Python virtual environment not found
```bash
cd backend
python -m venv venv
pip install -r requirements.txt
```

### npm dependencies not installed
```bash
cd frontend
npm install
```

### ESP8266 upload fails
- Check that ESP8266 is connected via USB
- Make sure no other program is using the COM port
- Try unplugging and replugging the ESP8266

### Port already in use
- Backend uses port **8000**
- Frontend uses port **3000**
- Make sure no other services are using these ports

---

## Manual Startup (Advanced)

If you prefer to start components individually:

### Terminal 1: ESP8266
```bash
cd "esp8266 mpu6050"
platformio run --target upload
platformio device monitor
```

### Terminal 2: Backend
```bash
cd backend
source venv/Scripts/activate  # Windows Git Bash
# or
source venv/bin/activate       # Linux/Mac/WSL
python src/main.py
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

---

## Connection Flow

Once all services are running:

1. **ESP8266** connects to WiFi
2. **ESP8266** establishes WebSocket connection to backend
3. **Frontend** connects to backend via WebSocket
4. Sensor data flows: `ESP8266` → `Backend` → `Frontend`
5. Open http://localhost:3000 in your browser

---

## Need Help?

- Check individual component logs for errors
- Ensure all prerequisites are installed
- Verify network connectivity for ESP8266
- Check that ports 8000 and 3000 are available

Happy training! 🏋️
