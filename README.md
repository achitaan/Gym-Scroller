# Gym Scroller 🏋️

A mobile-first strength training PWA that combines Hevy-style workout tracking with a YouTube Shorts feed that advances on validated reps. Built with Next.js App Router, Socket.IO, and the YouTube IFrame Player API.

## Features

### Core Workout Tracking (Hevy-style)
- **Today** - Daily plan with program type, readiness, streak, quality PRs
- **Train** - Pre-set config → live HUD → set summary with coaching tips
- **History** - VL distribution, speed at load, ROM trends, quality PRs
- **Profile** - Program modes (Strength/Hypertrophy/Technique), routines, integrations, accessibility

### Unique: Rep-Locked Shorts Feed
- Full-screen YouTube Shorts player using official IFrame API
- **Rep-lock mode**: Advance to next video only on valid rep completion
- **Rest mode**: Free scrolling between sets
- Autoplay compliance: starts muted, unmute on tap
- Preloads next video for seamless transitions

### Real-Time Metrics
- Socket.IO for live workout events (rep, setUpdate, setEnd)
- Metrics: TUT, avg speed, %VL, ROM hit rate, ROM variability, RIR
- One concise coaching tip per set

### PWA-Ready
- Installable on iOS/Android
- Offline shell for Today/Train
- Mobile-first gestures and layouts
- Dark theme optimized for fitness use

## Tech Stack

**Frontend** (Next.js 15 App Router)
- React 19, TypeScript, Tailwind CSS 4
- shadcn/ui components with Radix UI
- Socket.IO client for real-time events
- YouTube IFrame Player API
- next-themes for dark mode

**Backend** (Node.js + TypeScript)
- Express + Socket.IO for REST & WebSocket
- Calculation service for metric aggregation
- Shorts curation service (YouTube Data API v3)
- History API (planned)
- AI Assist endpoints (planned)

## Project Structure

```
Gym-Scroller/
├── frontend/               # Next.js App Router PWA
│   ├── app/
│   │   ├── (main)/        # Main app route group
│   │   ├── today/         # Today page
│   │   ├── train/         # Train page
│   │   ├── feed/          # Shorts feed page
│   │   ├── history/       # History page
│   │   ├── profile/       # Profile page
│   │   ├── api/           # API routes (YouTube)
│   │   └── layout.tsx     # Root layout with theme & socket provider
│   ├── components/
│   │   ├── youtube/       # PlayerCard with IFrame API
│   │   ├── feed/          # ShortsFeed with rep-lock logic
│   │   ├── train/         # PreSet, LiveSet, SetSummary
│   │   └── ui/            # shadcn/ui primitives
│   ├── lib/
│   │   ├── socket-context.tsx  # Socket.IO context provider
│   │   ├── types.ts            # TypeScript definitions
│   │   ├── design-tokens.ts    # Design system tokens
│   │   └── utils.ts
│   ├── public/
│   │   └── manifest.json  # PWA manifest
│   └── package.json
│
└── backend/               # Node.js + Socket.IO services
    ├── src/
    │   ├── services/
    │   │   ├── live-gateway.ts          # Socket.IO gateway
    │   │   ├── calculation-service.ts   # Metric aggregation
    │   │   └── shorts-curation.ts       # YouTube Shorts API
    │   ├── types/
    │   └── index.ts       # Express + Socket.IO server
    ├── package.json
    └── .env.example
```

## Quick Start

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local
echo "YOUTUBE_API_KEY=your_youtube_api_key" >> .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:3001" >> .env.local
```

4. Run development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env and add your YouTube API key
```

4. Run development server:
```bash
npm run dev
```

Backend runs on `http://localhost:3001`

## Key Implementation Details

### YouTube Shorts Integration

The `PlayerCard` component (`components/youtube/player-card.tsx`) implements the official YouTube IFrame Player API:

- Loads API script once: `https://www.youtube.com/iframe_api`
- Creates player with `YT.Player` constructor
- Player vars: `autoplay=1, mute=1, playsinline=1, modestbranding=1, controls=1, rel=0`
- Sets `origin` and `widget_referrer` for embed policy compliance
- Exposes methods: `play()`, `pause()`, `mute()`, `unMute()`, `seekTo()`, `loadVideo()`
- Handles autoplay: starts muted, unmute button on tap

### Rep-Locked Scrolling

The `ShortsFeed` component (`components/feed/shorts-feed.tsx`) implements the core feature:

```typescript
// Listen for valid reps
useEffect(() => {
  if (!repLockEnabled || isInRestPeriod) return

  const unsubscribe = subscribeToReps((rep) => {
    if (rep.valid && currentIndex < videos.length - 1) {
      advanceToNext() // Move to next Short
    }
  })

  return () => unsubscribe()
}, [repLockEnabled, isInRestPeriod, currentIndex])
```

- Rep-lock ON during sets: only valid reps advance feed
- Rep-lock OFF during rest: free scrolling + manual controls
- Preloads next video for gap-free transitions
- Touch gestures for manual control when unlocked

### Socket.IO Event Flow

```
Backend                    Frontend
   │                          │
   ├─ rep ────────────────────> Listen in ShortsFeed
   │  { valid, metrics }       Advance if valid + rep-locked
   │
   ├─ setUpdate ──────────────> Update LiveSet HUD
   │  { reps, vl, romHitRate } Show TUT, RIR, VL%
   │
   └─ setEnd ─────────────────> Show SetSummary
      { summary, tip }          Display metrics + coaching tip
```

## Design System

Design tokens in `lib/design-tokens.ts`:

```typescript
colors: {
  accent: { primary, success, warning, info },
  vl: { minimal, low, moderate, high, critical },
  background: { primary, secondary, tertiary, elevated },
  text: { primary, secondary, tertiary },
}
```

Dark theme optimized for gym use:
- High contrast for visibility
- Success green, warning amber, info blue
- VL bands color-coded (green → amber → red)

## API Endpoints

### Frontend Next.js API
- `GET /api/youtube` - Random Shorts video

### Backend Services
- `GET /health` - Health check
- `GET /api/shorts/queue?count=10` - Curated Shorts queue
- `POST /api/history/aggregate` - History analytics (TODO)
- `POST /api/ai/coach` - AI coaching tip (TODO)
- `POST /api/ai/plan` - Generate training plan (TODO)

### WebSocket Events
- `rep` - Single rep completed
- `setUpdate` - Set progress update
- `setEnd` - Set complete with summary
- `musicCue` - Music duck/restore
- `shorts` - Shorts queue update

## Data Contracts

See `frontend/lib/types.ts` for all TypeScript definitions:

```typescript
interface RepEvent {
  id: string
  valid: boolean
  metrics: { tut, speed, vl, romHit }
  ts: number
}

interface SetUpdate {
  repsCompleted: number
  avgSpeed: number
  vl: number
  romHitRate: number
  rir: number
  ts: number
}

interface SetEnd {
  summary: SetSummary
  tip: string
}
```

## PWA Configuration

`public/manifest.json` configured for:
- Standalone display mode (no browser chrome)
- Portrait orientation
- Dark theme color
- 192x192 and 512x512 icons
- App shortcuts (Today, Train, Feed)
- Categories: health, fitness, sports

To install on mobile:
1. Open app in mobile browser
2. Tap "Add to Home Screen"
3. App runs in standalone mode

## Performance Optimizations

- Socket updates rate-limited to 10-20 Hz
- Shorts queue cached 15 min to respect API quotas
- Next video preloaded (paused, muted)
- Offline shell for Today/Train routes
- Component-level code splitting

## Accessibility

- Touch targets ≥ 44px
- Color contrast AA compliance
- Focus visible on all interactive elements
- Dynamic Type support (planned)
- Haptics-only mode toggle
- High contrast mode toggle

## Security & Privacy

- YouTube API key server-side only
- `origin` and `widget_referrer` set on players
- Autoplay compliance: muted start, tap to unmute
- CORS restricted to frontend origin
- Local-only data storage mode (planned)

## Future Enhancements

### Phase 2
- [ ] Implement History database & aggregation API
- [ ] Add AI coaching (OpenAI/Anthropic integration)
- [ ] Offline support with service worker
- [ ] Apple Health & Spotify integration
- [ ] Push notifications for rest timer

### Phase 3
- [ ] Multi-user support & authentication
- [ ] Social features (share PRs, form checks)
- [ ] Advanced analytics dashboard
- [ ] Custom exercise library
- [ ] Superset & drop set support

## Development

```bash
# Run both frontend and backend concurrently
npm run dev          # in both /frontend and /backend

# Build for production
cd frontend && npm run build
cd backend && npm run build

# Lint
npm run lint
```

## Contributing

This is a demo project showcasing:
- Next.js 15 App Router with React 19
- YouTube IFrame Player API integration
- Real-time Socket.IO events
- Mobile-first PWA patterns
- Rep-locked video feed (novel UX)

## License

MIT

---

Built with ❤️ for strength athletes who lift heavy and scroll heavier.
