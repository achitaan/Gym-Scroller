import { NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;

// Tweak these to your taste
const SEEDS = ["a","b","c","music","funny","gym","tech","gaming","news","how to","meme","learn","food","travel","basketball","soccer"];

// Ad search parameters - add your search terms here
const AD_SEARCH_TERMS = [
  "dell technologies advertisement",
  "scotiabank advertisement",
  "ibm advertisement",
  "awake chocolate advertisement"
];

const MAX_RESULTS = 50;
const SHORTS_ONLY = true;
const SAFE_SEARCH = "moderate";
const RETRIES = 3;

// Cache system
const videoCache: any[] = [];
const CACHE_REFILL_THRESHOLD = 5;
const CACHE_MAX_SIZE = 20;
let isRefilling = false;

// helper: parse ISO8601 duration PT#M#S -> seconds
function isoToSeconds(iso: string) {
  const h = /(\d+)H/.exec(iso)?.[1] ?? "0";
  const m = /(\d+)M/.exec(iso)?.[1] ?? "0";
  const s = /(\d+)S/.exec(iso)?.[1] ?? "0";
  return (+h)*3600 + (+m)*60 + (+s);
}

// helper: pick a random past window
function randomWindow(daysBack = 5 * 365) {
  const now = new Date();
  const start = new Date(now.getTime() - Math.floor(Math.random() * daysBack) * 86400000);
  const end = new Date(Math.min(start.getTime() + 3 * 86400000, now.getTime()));
  return { publishedAfter: start.toISOString(), publishedBefore: end.toISOString() };
}

// Fetch videos from YouTube API
async function fetchVideosFromAPI(channelId: string | null, useAds: boolean = false): Promise<any[]> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    let seed: string;
    
    if (channelId) {
      seed = "";
    } else if (useAds) {
      seed = AD_SEARCH_TERMS[Math.floor(Math.random() * AD_SEARCH_TERMS.length)];
      console.log(` Using ad search term: "${seed}"`);
    } else {
      seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];
    }
    
    // For ads, don't limit by date to get more relevant results
    const { publishedAfter, publishedBefore } = useAds ? { publishedAfter: "", publishedBefore: "" } : randomWindow();

    // 1) search.list
    const searchParams: Record<string, string> = {
      key: KEY,
      part: "snippet",
      type: "video",
      maxResults: String(MAX_RESULTS),
      order: "relevance",
      safeSearch: SAFE_SEARCH,
    };
    
    // Add date filters only for non-ad searches
    if (publishedAfter) searchParams.publishedAfter = publishedAfter;
    if (publishedBefore) searchParams.publishedBefore = publishedBefore;
    
    // Make ad searches more specific
    if (seed) {
      if (useAds) {
        // For ads, use exact phrase search with quotes
        const baseSearch = seed.replace(' advertisement', '');
        searchParams.q = `"${seed}" OR "${baseSearch} commercial" OR "${baseSearch} ad"`;
        console.log(` Ad search query: ${searchParams.q}`);
      } else {
        searchParams.q = seed;
        if (SHORTS_ONLY) searchParams.videoDuration = "short";
      }
    }
    
    if (channelId) searchParams.channelId = channelId;

    const searchUrl = `${API}/search?${new URLSearchParams(searchParams)}`;
    console.log(` Search URL: ${searchUrl}`);
    
    const searchRes = await fetch(searchUrl, { cache: "no-store" });
    const searchJson = await searchRes.json();
    
    if (searchJson.error) {
      console.error(` YouTube API Error:`, searchJson.error);
      throw new Error(searchJson.error.message);
    }
    
    const ids = (searchJson.items ?? [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean);

    console.log(` Found ${ids.length} video candidates for "${seed}"`);
    if (!ids.length) continue;

    // 2) videos.list
    const videosUrl = `${API}/videos?${new URLSearchParams({
      key: KEY,
      part: "snippet,contentDetails,statistics",
      id: ids.join(","),
    })}`;

    const videosRes = await fetch(videosUrl, { cache: "no-store" });
    const videosJson = await videosRes.json();

    let items: any[] = videosJson.items ?? [];
    
    // For ads, be more flexible with duration
    if (useAds) {
      items = items.filter(v => isoToSeconds(v.contentDetails?.duration ?? "") <= 300);
      console.log(` ${items.length} ad videos after duration filter (5min)`);
    } else if (SHORTS_ONLY) {
      items = items.filter(v => isoToSeconds(v.contentDetails?.duration ?? "") <= 60);
      console.log(` ${items.length} videos after shorts filter (60s)`);
    }
    
    if (!items.length) continue;

    return items.map(v => ({
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
      duration: isoToSeconds(v.contentDetails?.duration ?? ""),
      isAd: useAds,
    }));
  }

  return [];
}

// Background cache refill
async function refillCache(channelId: string | null, useAds: boolean = false) {
  if (isRefilling) return;
  isRefilling = true;

  try {
    const videos = await fetchVideosFromAPI(channelId, useAds);
    if (videos.length > 0) {
      videoCache.push(...videos.slice(0, CACHE_MAX_SIZE));
      console.log(` Cache refilled with ${videos.length} videos (${useAds ? 'ads' : 'regular'})`);
    }
  } catch (error) {
    console.error(' Cache refill failed:', error);
  } finally {
    isRefilling = false;
  }
}

export async function GET(req: Request) {
  if (!KEY) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  const url = new URL(req.url);
  const channelId = url.searchParams.get("channelId");
  const useAds = url.searchParams.get("ads") === "true";

  // If requesting ads, always make fresh API call
  if (useAds) {
    console.log(` Fetching ad video with targeted search...`);
    const videos = await fetchVideosFromAPI(channelId, true);
    
    if (videos.length === 0) {
      return NextResponse.json({ error: "No ad videos found" }, { status: 404 });
    }

    const pick = videos[Math.floor(Math.random() * videos.length)];
    console.log(` Serving ad video: "${pick.title}" by ${pick.channelTitle}`);
    return NextResponse.json(pick);
  }

  // Regular mode - use cache system
  if (videoCache.length > 0) {
    const randomIndex = Math.floor(Math.random() * videoCache.length);
    const cachedVideo = videoCache.splice(randomIndex, 1)[0];
    
    console.log(` Serving from cache (${videoCache.length} remaining)`);
    
    if (videoCache.length < CACHE_REFILL_THRESHOLD && !isRefilling) {
      console.log(` Cache low, refilling...`);
      refillCache(channelId, false).catch(err => console.error('Refill error:', err));
    }
    
    return NextResponse.json(cachedVideo);
  }

  // Cache empty - make API call
  console.log(` Cache empty, fetching from YouTube API...`);
  const videos = await fetchVideosFromAPI(channelId, false);
  
  if (videos.length === 0) {
    return NextResponse.json({ error: "No videos found" }, { status: 404 });
  }

  const pick = videos[Math.floor(Math.random() * videos.length)];
  const remaining = videos.filter(v => v.id !== pick.id);
  videoCache.push(...remaining.slice(0, CACHE_MAX_SIZE - 1));
  
  console.log(` Fetched ${videos.length} shorts, serving 1, cached ${videoCache.length}`);
  
  return NextResponse.json(pick);
}
