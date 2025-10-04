# YouTube API Quota Optimization Guide

## Problem: Browser Console Errors

You're seeing tons of `ERR_BLOCKED_BY_CLIENT` errors in the browser console. **These are NOT using your YouTube API quota!** They're from:

- **Browser extensions** (ad blockers, privacy tools like uBlock Origin, Privacy Badger)
- Blocking YouTube's tracking/analytics endpoints (`generate_204`, `log_event`, `play.google.com/log`)
- These are **embedded player analytics**, not your API calls

### How to Reduce Console Noise

1. **Disable ad blockers temporarily** while testing
2. **Open incognito/private mode** (most extensions disabled by default)
3. **Ignore these specific errors** - they don't affect functionality or quota

---

## Real Quota Usage: API Caching System

### The Real Problem

Each time you fetch a short, your API makes **TWO** YouTube Data API requests:

| Request | Cost | Purpose |
|---------|------|---------|
| `search.list` | **100 units** | Find video candidates |
| `videos.list` | **1 unit** | Get video details & filter |
| **TOTAL** | **101 units** | Per short fetched |

**Daily Quota:** 10,000 units  
**Max Shorts Without Caching:** ~99 per day  
**With Caching:** **~1,980 shorts per day** (20x improvement!)

### Solution Implemented: Smart Caching

#### How It Works

```
Request #1 → YouTube API → Get 50 shorts → Serve 1, Cache 19
Requests #2-20 → Cache → Serve cached shorts (NO API CALL!)
Request #21 → Cache low → Trigger background refill
Requests #22-40 → Cache → Continue serving while refilling
... and so on
```

#### Key Features

1. **Initial Fetch**: First request calls API, gets up to 50 shorts, serves 1
2. **Cache Storage**: Remaining 19 shorts cached in memory (up to 20 max)
3. **Subsequent Requests**: Served from cache (0 quota cost!)
4. **Background Refill**: When cache drops below 5, automatically refills
5. **No Duplicates**: Each served video removed from cache

#### Configuration

```typescript
const CACHE_REFILL_THRESHOLD = 5;  // Refill when cache drops below this
const CACHE_MAX_SIZE = 20;          // Maximum videos to cache
const MAX_RESULTS = 50;             // Videos per API call (max 50)
```

#### Quota Math

**Before caching:**
- 100 shorts = 100 API calls = 10,100 quota units ❌ (exceeds daily limit)

**After caching:**
- 100 shorts = ~5 API calls = ~505 quota units ✅
- 1,980 shorts = ~99 API calls = 9,999 quota units (full daily quota)

**Efficiency gain: 19.8x fewer API calls!**

---

## Monitoring Quota Usage

### Console Logs

Watch your server logs for these messages:

```bash
📦 Serving from cache (14 remaining, idle)         # Cache hit - NO quota used
🔄 Cache low, refilling in background...           # Background refill triggered
✅ Cache refilled with 45 videos                   # Refill complete
🌐 Cache empty, fetching from YouTube API...       # Making API call
✅ Fetched 48 shorts, serving 1, cached 19         # API call complete
```

### GCP Quota Dashboard

Check your actual usage:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Dashboard**
3. Click **YouTube Data API v3**
4. View **Quotas** tab
5. Check "Queries per day" metric

### Expected Usage Patterns

| Activity | API Calls | Quota Used | Shorts Served |
|----------|-----------|------------|---------------|
| Light use (10 shorts/day) | ~1 call | ~101 units | 10 shorts |
| Medium use (100 shorts/day) | ~5 calls | ~505 units | 100 shorts |
| Heavy use (500 shorts/day) | ~25 calls | ~2,525 units | 500 shorts |
| Maximum (with quota) | ~99 calls | ~9,999 units | ~1,980 shorts |

---

## Additional Optimizations

### 1. Increase Cache Size (if you have memory)

```typescript
const CACHE_MAX_SIZE = 40; // Cache more videos per API call
```

**Pro:** Fewer API calls  
**Con:** More server memory usage

### 2. Adjust Refill Threshold

```typescript
const CACHE_REFILL_THRESHOLD = 10; // Refill earlier
```

**Pro:** Cache never runs completely empty  
**Con:** More frequent background API calls

### 3. Request More Results Per Call

```typescript
const MAX_RESULTS = 50; // Already at maximum allowed by YouTube
```

**Note:** 50 is the maximum. Can't go higher.

### 4. Use Multiple API Keys (Advanced)

If you hit quota limits, rotate between multiple API keys:

```typescript
const KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
];
const KEY = KEYS[Math.floor(Math.random() * KEYS.length)];
```

Each key gets 10,000 quota/day = 30,000 total.

### 5. Persistent Cache (Redis/Database)

For production, consider persisting cache across server restarts:

```typescript
// Pseudo-code
async function getVideoCache() {
  const cached = await redis.get('video_cache');
  return cached ? JSON.parse(cached) : [];
}

async function updateVideoCache(videos: any[]) {
  await redis.set('video_cache', JSON.stringify(videos), 'EX', 3600); // 1 hour TTL
}
```

---

## Troubleshooting

### "No videos found" errors

**Cause:** Random search returned 0 shorts  
**Solution:** Automatically retries with different search terms (RETRIES = 3)

### Cache not refilling

**Check logs for:**
- `isRefilling` flag stuck as true
- API errors during refill
- Network timeouts

**Solution:** Restart server to reset state

### Still hitting quota limits

**Check:**
1. Server logs for actual API call count
2. GCP quota dashboard for real usage
3. Multiple instances running (Docker, PM2, etc.)
4. Frontend making direct API calls (should only call your backend)

---

## Summary

✅ **Implemented:** Smart caching system  
✅ **Result:** 20x reduction in API calls  
✅ **Capacity:** ~1,980 shorts/day (vs 99 before)  
✅ **Console errors:** Unrelated to quota (browser extensions)  
✅ **Monitoring:** Console logs + GCP dashboard  

**Your quota concerns are now addressed!** The browser errors you're seeing are harmless and don't affect your API usage.
