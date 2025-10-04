import { NextResponse } from "next/server";

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;

// Tweak these to your taste
const SEEDS = ["a","b","c","music","funny","gym","tech","gaming","news","how to","meme","learn","food","travel","basketball","soccer"];
const MAX_RESULTS = 50;         // per page (max 50)
const SHORTS_ONLY = true;       // set false for any length
const SAFE_SEARCH = "moderate"; // "none" | "moderate" | "strict"
const RETRIES = 3;              // retry with different seeds if empty

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

export async function GET(req: Request) {
  if (!KEY) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  const url = new URL(req.url);
  const channelId = url.searchParams.get("channelId"); // optional: random from a specific channel

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

    const pick = items[Math.floor(Math.random() * items.length)];
    return NextResponse.json({
      id: pick.id,
      title: pick.snippet.title,
      channelTitle: pick.snippet.channelTitle,
      publishedAt: pick.snippet.publishedAt,
      thumbnail: pick.snippet.thumbnails?.high?.url || pick.snippet.thumbnails?.medium?.url,
      embedUrl: `https://www.youtube.com/embed/${pick.id}`,
    });
  }

  return NextResponse.json({ error: "No results after retries" }, { status: 404 });
}
