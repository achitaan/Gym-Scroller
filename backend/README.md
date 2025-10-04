# Gym Scroller Backend

Backend services for the Gym Scroller mobile-first strength training app.

## Services

### 1. Live Gateway (Socket.IO)
- Real-time WebSocket server for workout events
- Broadcasts: `rep`, `setUpdate`, `setEnd`, `musicCue`, `shorts`
- Handles client connections and live workout streaming
- Rate-limits UI updates to 10-20 Hz

### 2. Calculation Service
- Processes raw metrics into aggregated per-rep and per-set data
- Computes: TUT, avg speed, %VL, ROM hit rate, ROM variability
- Generates concise coaching tips based on set performance

### 3. Shorts Curation API
- Fetches curated YouTube Shorts queues using YouTube Data API v3
- Filters videos to ≤60 seconds (true Shorts)
- 15-minute cache to respect API quotas
- Fallback to mock data in development

### 4. History API (TODO)
- REST endpoints for workout history aggregates
- Filters by lift, program, date range
- Returns: VL distribution, speed at load, trends

### 5. AI Assist (TODO)
- `/api/ai/coach` - One concise tip from recent sets
- `/api/ai/plan` - Generate 4-week training blocks
- `/api/ai/explain` - Summarize last set metrics

## Setup

1. Create a Python virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your YouTube Data API key to `.env`:
```
YOUTUBE_API_KEY=your_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

5. Run development server:
```bash
cd src
python main.py
```

The server will start on `http://localhost:3001`

## API Endpoints

### REST
- `GET /health` - Health check
- `GET /api/shorts/queue?count=10` - Get curated Shorts queue
- `POST /api/history/aggregate` - Get workout history aggregates (TODO)
- `POST /api/ai/coach` - Get AI coaching tip (TODO)
- `POST /api/ai/plan` - Generate training plan (TODO)

### WebSocket Events

#### Client → Server
- `startSet` - Notify set started
- `endSet` - Notify set ended with rep data

#### Server → Client
- `rep` - Single rep completed
- `setUpdate` - Set progress update
- `setEnd` - Set complete with summary
- `musicCue` - Music duck/restore cue
- `shorts` - Shorts queue update

## Data Contracts

See `../frontend/lib/types.ts` for TypeScript definitions.

## Development

```bash
# Development mode (auto-reload on changes)
cd src
python main.py

# Production mode (with uvicorn)
cd src
uvicorn main:socket_app --host 0.0.0.0 --port 3001
```

## Security Notes

- YouTube API key must be server-side only (never expose to frontend)
- Set `origin` and `widget_referrer` on YouTube players
- Respect autoplay policies: muted start, unmute on tap
- Use CORS to restrict frontend origins in production

## Performance

- Socket updates rate-limited to 10-20 Hz to reduce UI jank
- Shorts queue cached for 15 minutes to respect API quotas
- Raw metrics preserved in store for post-analysis

## Future Enhancements

- [ ] Implement History API with database
- [ ] Add AI coaching integration (OpenAI/Anthropic)
- [ ] Add authentication & user sessions
- [ ] Persist workout data to database
- [ ] Add analytics & monitoring
