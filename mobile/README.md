# Gym Scroller Mobile (Expo)

This is a WebView wrapper for the Gym Scroller Next.js app, allowing you to run it as a native mobile app.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Update the URL
Edit `App.tsx` and change `WEB_APP_URL`:

**For Local Development:**
- Find your computer's IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Change to: `http://YOUR_IP:3000` (e.g., `http://192.168.1.5:3000`)
- Make sure your Next.js app is running on your computer

**For Production:**
- Change to your deployed URL: `https://your-app.vercel.app`

### 3. Start Expo
```bash
npm start
```

### 4. Run on Your Phone

**Option A: Expo Go (Easiest)**
1. Install "Expo Go" app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in terminal
3. App loads on your phone!

**Option B: Simulator**
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)

## 📱 Requirements

- Your phone and computer must be on the **same WiFi network**
- Your Next.js app must be running (`cd ../frontend && npm run dev`)
- Your backend must be running (`cd ../backend && npm run dev`)

## 🎨 Customization

### Add App Icons
Replace these placeholder images in `assets/`:
- `icon.png` - 1024x1024px app icon
- `splash.png` - 1284x2778px splash screen
- `adaptive-icon.png` - 1024x1024px (Android)

### Build Standalone App
```bash
# Build for Android
npx expo build:android

# Build for iOS (requires Mac)
npx expo build:ios
```

## 🔧 Troubleshooting

**Can't connect to Metro bundler:**
- Make sure you're on the same WiFi
- Try running: `npm start -- --tunnel`

**App shows "Unable to load":**
- Check that Next.js is running: `http://YOUR_IP:3000`
- Update `WEB_APP_URL` in `App.tsx` with correct IP

**Black screen:**
- Wait a few seconds for the app to load
- Check your Next.js terminal for errors
