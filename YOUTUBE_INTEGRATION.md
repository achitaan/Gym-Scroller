# YouTube Shorts Integration

This app integrates real YouTube Shorts to keep users engaged during rest periods and in a dedicated feed page.

## Setup Instructions

### 1. Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Configure Environment Variables

1. Copy the example env file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Add your YouTube API key to `.env.local`:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

## Features

### 1. **Feed Page** (`/feed`)
- Infinite scroll of YouTube Shorts
- Rep-locked mode: advance only on valid reps (development feature)
- Free scroll mode: normal swipe navigation
- Keyboard support: ↑/↓ arrow keys
- Touch support: swipe up/down
- Auto-loads next short as you approach the end

### 2. **Rest Period Shorts** (Workout Detail Page)
- When the rest timer is active, tap "Watch Short" to view a YouTube short
- Helps pass time during rest periods
- Can close anytime to return to workout
- Fetches random gym/fitness-related shorts

### 3. **API Route** (`/api/youtube`)
- Server-side route that fetches random YouTube Shorts
- Filters to true Shorts (≤60 seconds)
- Configurable seed topics (gym, fitness, etc.)
- Implements retry logic for better reliability
- Random time window selection for variety

## API Configuration

The YouTube API can be customized in `/app/api/youtube/route.ts`:

```typescript
const SEEDS = ["gym", "fitness", "workout", "training", "exercise"];
const MAX_RESULTS = 50;         // per page (max 50)
const SHORTS_ONLY = true;       // set false for any length
const SAFE_SEARCH = "moderate"; // "none" | "moderate" | "strict"
const RETRIES = 3;              // retry with different seeds if empty
```

### Seed Topics
Update the `SEEDS` array to customize the type of content:
- Current: General topics + gym/fitness
- Fitness-focused: `["gym", "workout", "fitness", "bodybuilding", "crossfit"]`
- Broader: Add more topics like `["motivation", "health", "nutrition"]`

## Usage in Code

### Using the Hook

```typescript
import { useYouTubeShorts } from "@/lib/use-youtube-shorts";

function MyComponent() {
  const { videos, loading, error, fetchShort, fetchMultiple } = useYouTubeShorts();

  // Load initial videos
  useEffect(() => {
    fetchMultiple(3); // Load 3 videos
  }, []);

  // Fetch one more video
  const loadMore = async () => {
    await fetchShort();
  };

  return (
    <div>
      {videos.map((video) => (
        <iframe key={video.id} src={video.embedUrl} />
      ))}
    </div>
  );
}
```

### Video Object Structure

```typescript
interface YouTubeShort {
  id: string;            // Video ID
  title: string;         // Video title
  channelTitle: string;  // Channel name
  publishedAt: string;   // Publication date
  thumbnail: string;     // Thumbnail URL
  embedUrl: string;      // Full embed URL
}
```

## Rate Limits & Quotas

YouTube Data API v3 has daily quotas:
- **Default quota**: 10,000 units/day
- **Search operation**: ~100 units per request
- **Videos operation**: ~1 unit per request
- **Approximate requests**: ~95 full searches per day

### Optimization Tips

1. **Cache videos** on the client side (already implemented in `useYouTubeShorts`)
2. **Batch loading**: Load multiple videos at once with `fetchMultiple()`
3. **Preload**: Fetch next video before user reaches the end
4. **Monitor usage**: Check quota usage in Google Cloud Console

## Troubleshooting

### "Missing API key" error
- Ensure `YOUTUBE_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### "No results after retries" error
- YouTube API might be temporarily unavailable
- Try different seed topics
- Check API quota in Google Cloud Console

### Videos not loading
- Check browser console for errors
- Verify API key is valid and not restricted
- Ensure YouTube Data API v3 is enabled in your project

### Quota exceeded
- Wait for quota reset (midnight PST)
- Request quota increase in Google Cloud Console
- Implement caching strategies

## Future Enhancements

Potential improvements:
1. **Personalized content**: Based on user's workout type
2. **Favorite channels**: Allow users to add favorite fitness channels
3. **Watch history**: Track and avoid recently shown videos
4. **Offline mode**: Cache videos for offline viewing
5. **Analytics**: Track which videos users engage with most
6. **Playlist support**: Create curated playlists for different workout phases

## Architecture

```
/app/api/youtube/route.ts       # Server-side API route
/lib/use-youtube-shorts.ts      # React hook for fetching shorts
/app/feed/page.tsx              # Main feed page
/components/RestPeriodShorts.tsx # Rest period modal
/app/workout/[id]/page.tsx      # Workout detail with rest shorts
```

## Hevy UX Pattern

This integration follows Hevy's principle of **keeping users engaged during rest periods**:
- Rest periods can feel long and boring
- Entertainment keeps users in the app
- Reduces phone unlocks during workouts
- Creates positive association with rest periods
- Encourages users to take proper rest (not skip it)

---

**Note**: This is an independent implementation inspired by Hevy's UX patterns. No proprietary Hevy code or assets are used.
