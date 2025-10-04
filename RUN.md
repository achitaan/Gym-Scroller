# How to Run Gym Scroller

## Quick Commands

### Backend (Terminal 1)
```bash
cd backend
npm install    # First time only
npm run dev
```
Server starts on **http://localhost:3001**

### Frontend (Terminal 2)
```bash
cd frontend
npm install    # First time only
npm run dev
```
App opens at **http://localhost:3000**

## That's it! 🎉

Open **http://localhost:3000** in your browser.

## What You'll See

1. **App redirects to Today screen**
2. **Bottom tabs**: Today, Train, Feed, History, Profile
3. **Mock workout events** start after 3 seconds (backend auto-generates)

## Try It Out

### Start a Workout
1. Tap **Train** tab
2. Tap **Start Set**
3. Configure exercise, target, tempo
4. Toggle **Rep-locked scrolling** ON
5. Tap **Start Set**
6. Watch mock reps increment
7. See VL color band change
8. After 8 reps → Set Summary appears

### Browse Shorts Feed
1. Tap **Feed** tab
2. Watch YouTube Shorts
3. Toggle **Rep-Locked** button at bottom
4. Toggle **Resting** to enable free scroll
5. Swipe up/down to navigate

### View Analytics
1. Tap **History** tab
2. See VL distribution chart
3. See speed at load chart
4. See recent sessions

### Configure Settings
1. Tap **Profile** tab
2. Select program mode (Strength/Hypertrophy/Technique)
3. Toggle integrations
4. Toggle accessibility options

## Stop Servers

Press **Ctrl+C** in each terminal.

---

📚 For more details, see:
- [QUICKSTART.md](./QUICKSTART.md) - Step-by-step walkthrough
- [README.md](./README.md) - Full documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production
