# Gym Scroller Mobile - Quick Start

## 📲 Get Your App Running on Your Phone in 3 Steps!

### Step 1: Install Expo Go on Your Phone
- **iPhone**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Find Your Computer's IP Address
```powershell
ipconfig
```
Look for "IPv4 Address" (example: 192.168.1.5)

### Step 3: Update & Run

1. Open `mobile/App.tsx`
2. Change line 10 to your IP:
   ```typescript
   const WEB_APP_URL = 'http://192.168.1.5:3000'; // Use YOUR IP!
   ```
3. Install and start:
   ```powershell
   cd mobile
   npm install
   npm start
   ```
4. Scan the QR code with your phone
5. Done! 🎉

## ⚠️ Important
- Your computer and phone must be on the **same WiFi**
- Keep your frontend running: `cd frontend && npm run dev`
- Keep your backend running: `cd backend && npm run dev`

## 🎨 Optional: Add Your App Icon
Replace files in `mobile/assets/`:
- Copy `frontend/public/placeholder-logo.png` → `assets/icon.png`
- Resize to 1024x1024px

## 🚀 Build a Real App (Later)
```bash
# Create standalone app
eas build --platform android
eas build --platform ios
```
