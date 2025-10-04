import { NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;

// Tweak these to your taste
const SEEDS = ["a","b","c","music","funny","gym","tech","gaming","news","how to","meme","learn","food","travel","basketball","soccer"];
const MAX_RESULTS = 50;         // per page (max 50)
const SHORTS_ONLY = true;       // set false for any length
const SAFE_SEARCH = "moderate"; // "none" | "moderate" | "strict"
const RETRIES = 3;              // retry with different seeds if empty

// 🛡️ QUOTA PROTECTION: Cache videos to reduce API calls
// Each API call costs 101 quota units (100 for search.list + 1 for videos.list)
// With 10,000 daily quota, you can only fetch ~99 times/day
// This cache allows 1 API call to serve 20-50 shorts!
const videoCache: any[] = [];
const CACHE_REFILL_THRESHOLD = 5; // Refill cache when it drops below this
const CACHE_MAX_SIZE = 20; // Maximum videos to cache
let isRefilling = false; // Prevent duplicate refill requests

// helper: parse ISO8601 duration PT#M#S -> seconds
function isoToSeconds(iso: string) {
  const h = /(\d+)H/.exec(iso)?.[1] ?? "0";
  const m = /(\d+)M/.exec(iso)?.[1] ?? "0";
  const s = /(\d+)S/.exec(iso)?.[1] ?? "0";
  return (+h)*3600 + (+m)*60 + (+s);
}

// helper: pick a random past window (e.g., any day in the last ~5 years)
function randomWindow(daysBack = 5 * 365) {
  const now = new Date();
  const start = new Date(now.getTime() - Math.floor(Math.random() * daysBack) * 86400000);
  // constrain to a ~3-day window for variety
  const end = new Date(Math.min(start.getTime() + 3 * 86400000, now.getTime()));
  return { publishedAfter: start.toISOString(), publishedBefore: end.toISOString() };
}

// Helper: Fetch videos from YouTube API and return formatted array
async function fetchVideosFromAPI(channelId: string | null): Promise<any[]> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const seed = channelId ? "" : SEEDS[Math.floor(Math.random() * SEEDS.length)];
    const { publishedAfter, publishedBefore } = randomWindow();

    // 1) search.list → get up to 50 candidates
    const searchParams: Record<string, string> = {
      key: KEY,
      part: "snippet",
      type: "video",
      maxResults: String(MAX_RESULTS),
      order: "relevance",
      safeSearch: SAFE_SEARCH,
      publishedAfter,
      publishedBefore,
    };
    if (seed) searchParams.q = seed;
    if (channelId) searchParams.channelId = channelId;
    if (SHORTS_ONLY) searchParams.videoDuration = "short"; // <4 min (we’ll post-filter to ≤60s)

    const searchUrl = `${API}/search?${new URLSearchParams(searchParams)}`;
    const searchRes = await fetch(searchUrl, { cache: "no-store" });
    const searchJson = await searchRes.json();
    const ids = (searchJson.items ?? [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean);

    if (!ids.length) continue;

    // 2) videos.list → filter to true Shorts (≤60s) and pick one at random
    const videosUrl = `${API}/videos?${new URLSearchParams({
      key: KEY,
      part: "snippet,contentDetails,statistics",
      id: ids.join(","),
    })}`;

    const videosRes = await fetch(videosUrl, { cache: "no-store" });
    const videosJson = await videosRes.json();

    let items: any[] = videosJson.items ?? [];
    if (SHORTS_ONLY) {
      items = items.filter(v => isoToSeconds(v.contentDetails?.duration ?? "") <= 60);
    }
    if (!items.length) continue;

    // Transform to our format and return all videos
    return items.map(v => ({
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
    }));
  }

  return []; // No videos found after retries
}

// Background cache refill function
async function refillCache(channelId: string | null) {
  if (isRefilling) return;
  isRefilling = true;

  try {
    const videos = await fetchVideosFromAPI(channelId);
    if (videos.length > 0) {
      videoCache.push(...videos.slice(0, CACHE_MAX_SIZE));
      console.log(`✅ Cache refilled with ${videos.length} videos`);
    }
  } catch (error) {
    console.error('❌ Cache refill failed:', error);
  } finally {
    isRefilling = false;
  }
}

export async function GET(req: Request) {
  if (!KEY) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  const url = new URL(req.url);
  const channelId = url.searchParams.get("channelId");

  // 🛡️ QUOTA SAVER: Serve from cache if available
  if (videoCache.length > 0) {
    const randomIndex = Math.floor(Math.random() * videoCache.length);
    const cachedVideo = videoCache.splice(randomIndex, 1)[0];
    
    console.log(`📦 Serving from cache (${videoCache.length} remaining, ${isRefilling ? 'refilling...' : 'idle'})`);
    
    // Refill cache in background if running low
    if (videoCache.length < CACHE_REFILL_THRESHOLD && !isRefilling) {
      console.log(`🔄 Cache low, refilling in background...`);
      refillCache(channelId).catch(err => console.error('Refill error:', err));
    }
    
    return NextResponse.json(cachedVideo);
  }

  // Cache empty - make API call
  console.log(`🌐 Cache empty, fetching from YouTube API...`);
  const videos = await fetchVideosFromAPI(channelId);
  
  if (videos.length === 0) {
    return NextResponse.json({ error: "No videos found" }, { status: 404 });
  }

  // Take one video, cache the rest
  const pick = videos[Math.floor(Math.random() * videos.length)];
  const remaining = videos.filter(v => v.id !== pick.id);
  videoCache.push(...remaining.slice(0, CACHE_MAX_SIZE - 1));
  
  console.log(`✅ Fetched ${videos.length} shorts, serving 1, cached ${videoCache.length}`);
  
  return NextResponse.json(pick);
}
