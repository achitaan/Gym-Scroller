# Quick Start Guide

Get Gym Scroller running in under 5 minutes.

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Gym-Scroller

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev
```

Backend runs on **http://localhost:3001**

The backend will:
- Start Socket.IO server for live events
- Start mock rep/set events (for demo)
- Serve Shorts curation API
- Provide health check at `/health`

### 3. Start the Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:3000**

### 4. Open the App

Navigate to **http://localhost:3000** in your browser.

The app will redirect you to the **Today** screen.

## 📱 App Navigation

### Bottom Tabs
- **Today** - Daily workout plan, streak, quality PRs
- **Train** - Start a workout (pre-set → HUD → summary)
- **Feed** - YouTube Shorts feed (rep-locked mode)
- **History** - Analytics dashboards
- **Profile** - Program settings & preferences

## 🏋️ Try a Workout

### Step 1: Go to Train
1. Tap **Train** tab
2. Tap **Start Set** button

### Step 2: Configure Set
1. Select exercise (e.g., "Back Squat")
2. Set target: RPE 8 or 80% 1RM
3. Configure tempo: 3-1-X-1
4. Set rest timer: 180 seconds
5. Toggle **Rep-locked scrolling** ON
6. Choose music mode
7. Tap **Start Set**

### Step 3: In-Set Experience
- Watch the **rep counter** increment (mock events)
- See **ROM hit** icons appear
- Monitor **TUT timer** and **VL percentage**
- VL color band changes from green → yellow → red
- RIR decreases as set progresses

After 8 reps (mock), the set ends automatically.

### Step 4: Set Summary
- View metrics: Reps, TUT, avg speed, VL%, ROM hit rate
- Read coaching tip
- Tap **Log & Next Set** to continue

### Step 5: Rest Period
- See countdown timer
- Music auto-duck indicator shown
- Tap **Open Feed** to browse Shorts
- Tap **Next Set** when ready

## 🎬 Try the Feed

### Step 1: Open Feed
- Tap **Feed** tab
- Or tap **Open Feed** during rest

### Step 2: Rep-Locked Mode
- Toggle **Rep-Locked** button at bottom
- Videos will only advance on valid reps
- Toggle **Resting** to enable free scroll

### Step 3: Watch Shorts
- Full-screen YouTube Shorts
- Swipe up/down to navigate (when unlocked)
- Videos start muted (autoplay policy)
- Tap video to unmute

## 📊 View History

### Step 1: Open History
- Tap **History** tab

### Step 2: Explore Dashboards
- **Velocity Loss Distribution** - Bar chart by VL range
- **Speed at Fixed Loads** - Line chart of speed vs load
- **Recent Sessions** - Timeline of past workouts

### Step 3: Filters (Future)
- Filter by program type
- Filter by exercise
- Filter by date range

## ⚙️ Configure Profile

### Step 1: Open Profile
- Tap **Profile** tab

### Step 2: Select Program Mode
- **Strength**: 10-20% VL, speed focus
- **Hypertrophy**: 20-30% VL, TUT focus
- **Technique**: <10% VL, quality focus

### Step 3: Integrations
- Toggle **Music Link** (future: Spotify/Apple Music)
- Toggle **Health Sharing** (future: HealthKit sync)

### Step 4: Accessibility
- **Large Text**: Increase font sizes
- **High Contrast**: Boost color contrast
- **Haptics Only**: Vibration feedback only

## 🔧 Customization

### Add Your Own Shorts
Edit `backend/src/services/shorts-api.ts`:

```typescript
this.curatedQueue = [
  'your-video-id-1',
  'your-video-id-2',
  'your-video-id-3',
];
```

### Modify Program Modes
Edit `frontend/lib/types.ts`:

```typescript
export const PROGRAM_CONFIGS: Record<ProgramType, ProgramConfig> = {
  strength: {
    type: 'strength',
    vlStopRange: [10, 20], // Change VL stop range
    focusMetrics: ['vl', 'speed'],
  },
  // ...
};
```

### Change Theme Colors
Edit `frontend/lib/design-tokens.ts`:

```typescript
export const tokens = {
  colors: {
    accent: {
      primary: '#3B82F6', // Change primary blue
      // ...
    },
  },
};
```

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Frontend won't start
```bash
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Socket connection fails
1. Check backend is running on port 3001
2. Verify `frontend/lib/socket-context.tsx` URL is `http://localhost:3001`
3. Check browser console for errors

### YouTube videos won't load
1. Ensure you're on a supported browser (Chrome, Safari, Edge)
2. Check browser console for IFrame API errors
3. Verify internet connection (YouTube API required)

### PWA won't install
1. PWA requires HTTPS (works on localhost)
2. Check manifest at `http://localhost:3000/manifest.json`
3. Use Chrome DevTools → Application → Manifest to debug

## 📱 Install as PWA (Optional)

### Desktop (Chrome)
1. Click install icon in address bar (⊕)
2. Click "Install"

### Mobile (iOS Safari)
1. Tap Share button
2. Tap "Add to Home Screen"

### Mobile (Android Chrome)
1. Tap menu (⋮)
2. Tap "Install app"

## 🎯 Next Steps

- [ ] Connect real IMU sensors (replace mock events)
- [ ] Add YouTube Data API key for Shorts discovery
- [ ] Implement persistent database (Prisma + PostgreSQL)
- [ ] Add authentication (NextAuth.js)
- [ ] Deploy to production (Vercel + Railway)

## 📚 Documentation

- **Full README**: [README.md](./README.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: See `backend/src/index.ts` for endpoints
- **Type Definitions**: See `frontend/lib/types.ts` for data contracts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

**Ready to lift! 🏋️💪**
