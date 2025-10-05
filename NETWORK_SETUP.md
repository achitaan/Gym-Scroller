# WiFi Network Configuration Guide 🌐

## Problem Solved
ESP8266 and Computer now connect to the **same WiFi network**, allowing:
- ✅ ESP8266 to communicate with computer (WebSocket)
- ✅ Computer to access internet (YouTube Shorts)
- ✅ No need to switch between networks

---

## Network Topology

```
         🌍 Internet
              |
         🏠 Home Router
         (192.168.1.1)
              |
    ──────────┴──────────
    |                   |
📱 ESP8266          💻 Computer
(192.168.1.150)    (192.168.1.100)
    |                   |
    |                   ├─ 🐍 Backend :8000
    |                   └─ ⚛️ Frontend :3000
    |                   
    └───── WebSocket ────┘
```

---

## Setup Instructions

### Step 1: Find Your Computer's IP Address

#### Windows
```bash
ipconfig
```
Look for **"IPv4 Address"** under your WiFi adapter
Example: `192.168.1.100`

#### Mac
```bash
ifconfig en0 | grep "inet " | awk '{print $2}'
```
Or check System Preferences → Network → WiFi → Advanced → TCP/IP

#### Linux
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Write down your IP address:** `__________________`

---

### Step 2: Configure ESP8266

1. Open `esp8266 mpu6050/src/main.cpp`

2. Update WiFi credentials (lines 48-49):
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // Your home WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

3. Update backend server IP (line 53):
```cpp
const char* wsHost = "192.168.1.100";  // Use YOUR computer's IP from Step 1
const uint16_t wsPort = 8000;          // Backend port
```

4. Flash the updated firmware to ESP8266:
   - Connect ESP8266 via USB
   - In VS Code, open PlatformIO
   - Click "Upload" button

---

### Step 3: Configure Backend

The backend is already configured to listen on all network interfaces (`0.0.0.0`).

**Just start the backend:**
```bash
cd backend
python src/main.py
```

**Expected output:**
```
==================================================
🚀 Gym Scroller Backend Starting...
==================================================
📍 Local access:   http://127.0.0.1:8000
🌐 Network access: http://192.168.1.100:8000
🔌 ESP8266 should connect to: 192.168.1.100:8000
💻 Frontend should use: http://192.168.1.100:8000
==================================================
```

**Verify the IP address matches your computer's IP!**

---

### Step 4: Configure Frontend

1. Copy the environment template:
```bash
cd frontend
cp .env.local.example .env.local
```

2. Edit `.env.local` with your computer's IP:
```bash
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
```

3. Start the frontend:
```bash
npm run dev
```

4. Open browser: `http://localhost:3000`

---

### Step 5: Test the Connection

#### A. Start Backend
```bash
cd backend
python src/main.py
```
✅ Should show network IP address

#### B. Power ESP8266
Watch serial monitor (115200 baud):
```
🚀 Starting ESP8266 Gym Tracker...
📡 Connecting to WiFi: YourWiFiName
.....
✅ WiFi connected successfully!
📍 ESP8266 IP Address: 192.168.1.150
🔌 Will connect to backend at: ws://192.168.1.100:8000
[WS] ✅ WebSocket Connected
[SocketIO] ✅ Connected and ready to send data
```

#### C. Check Backend Console
```
🟢 Client connected: abc123xyz
✅ Connection acknowledged for abc123xyz
```

#### D. Start Frontend
```bash
cd frontend
npm run dev
```
Open browser console:
```
✅ [Socket] Connected to backend
[Socket] Connection acknowledged: {status: "connected", sid: "..."}
```

---

## Troubleshooting

### ESP8266 Can't Connect to WiFi

**Check 1: WiFi Credentials**
```cpp
// Make sure SSID and password are correct
const char* WIFI_SSID = "MyHomeWiFi";  // Case-sensitive!
const char* WIFI_PASSWORD = "mypassword123";
```

**Check 2: WiFi Band**
- ESP8266 only supports **2.4GHz** WiFi
- Does NOT support 5GHz networks
- Make sure your router has 2.4GHz enabled

**Check 3: Serial Output**
```
❌ WiFi connection FAILED!
⚠️ Please check your WiFi credentials in main.cpp
```
→ Double-check SSID and password

### ESP8266 Can't Reach Backend

**Check 1: Computer IP Address**
```cpp
// Make sure this matches your actual IP
const char* wsHost = "192.168.1.100";  // Update this!
```

**Check 2: Same Network**
- ESP8266 IP: `192.168.1.150`
- Computer IP: `192.168.1.100`
- Should have same first 3 numbers!

**Check 3: Windows Firewall**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Gym Scroller Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

**Check 4: Backend Running**
```bash
# Should show your network IP
🌐 Network access: http://192.168.1.100:8000
```

### Frontend Can't Connect to Backend

**Check 1: Environment Variable**
```bash
# In frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
```

**Check 2: Restart Frontend**
After changing `.env.local`, restart the dev server:
```bash
# Ctrl+C to stop, then:
npm run dev
```

**Check 3: Browser Console**
```javascript
// Should show your backend IP
[Socket] Connecting to: http://192.168.1.100:8000
```

### YouTube Shorts Not Loading

**Check 1: Internet Connection**
```bash
# Test internet access
ping google.com
```

**Check 2: API Key**
Check if YouTube API key is configured in `frontend/app/api/youtube/route.ts`

---

## Quick Reference

### File Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `esp8266/../main.cpp` | WiFi STA mode, credentials, server IP | Connect to home WiFi |
| `backend/src/main.py` | Listen on `0.0.0.0`, port 8000 | Accept network connections |
| `frontend/lib/socket-context.tsx` | Use env variable | Configurable backend URL |
| `frontend/.env.local` | Backend URL | Point to computer's IP |

### Port Summary

| Service | Port | Access |
|---------|------|--------|
| Backend | 8000 | ESP8266 + Frontend |
| Frontend | 3000 | Browser |
| WebSocket | 8000 | ESP8266 → Backend |

### IP Address Reference

| Device | Example IP | Your IP |
|--------|-----------|---------|
| Router | 192.168.1.1 | _________ |
| Computer | 192.168.1.100 | _________ |
| ESP8266 | 192.168.1.150 | _________ |

---

## Testing Checklist

- [ ] Found computer's IP address
- [ ] Updated ESP8266 WiFi credentials
- [ ] Updated ESP8266 server IP
- [ ] Flashed ESP8266 firmware
- [ ] Started backend (shows network IP)
- [ ] Created frontend `.env.local`
- [ ] Updated frontend backend URL
- [ ] ESP8266 connects to WiFi (serial monitor)
- [ ] ESP8266 connects to backend (serial + backend logs)
- [ ] Frontend connects to backend (browser console)
- [ ] Sensor data flows (concentric/eccentric logs)
- [ ] YouTube Shorts load in feed

---

## Success Indicators

### ESP8266 Serial Monitor
```
✅ WiFi connected successfully!
📍 ESP8266 IP Address: 192.168.1.150
[WS] ✅ WebSocket Connected
[SocketIO] ✅ Connected and ready to send data
📊 Heap: 28456 bytes | WiFi: 3 | Reps: 0
```

### Backend Console
```
🟢 Client connected: Flg32CLkZFFqixQtAAAB
✅ Connection acknowledged for Flg32CLkZFFqixQtAAAB
[Flg32CLkZFFqixQtAAAB] State: concentric
```

### Frontend Browser Console
```
✅ [Socket] Connected to backend
[Socket] Connection acknowledged: {status: "connected", ...}
🏋️  CONCENTRIC phase - lifting
⬇️  ECCENTRIC phase - lowering
```

---

## Network Setup Complete! ✅

Your system now:
- ✅ ESP8266 connects to home WiFi (not its own AP)
- ✅ Computer stays connected to home WiFi (has internet)
- ✅ Backend accessible from ESP8266 AND frontend
- ✅ YouTube Shorts work (internet access maintained)
- ✅ WebSocket communication works across local network

**Everything is on the same network with internet access!** 🎉
