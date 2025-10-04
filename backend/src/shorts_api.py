import httpx
import os
from typing import List, Dict, Any
from pydantic import BaseModel


class ShortsQueueResponse(BaseModel):
    queue: List[str]


class ShortsAPI:
    """
    Shorts Curation API

    Provides curated YouTube Shorts videoIds for the feed.
    Uses YouTube Data API v3 for discovery (optional) or serves pre-curated lists.
    """

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")  # Server-side only

        # Pre-curated fitness Shorts (replace with real IDs)
        self.curated_queue = [
            "jfKfPfyJRdk",
            "sDvf4qX3rbs",
            "mCdA4bJAGGk",
            "abc123XYZ",
            "def456UVW",
            "ghi789RST",
        ]

    async def get_curated_queue(self, limit: int = 10) -> ShortsQueueResponse:
        """
        Get a curated queue of Shorts videoIds
        """
        # Return pre-curated list
        queue = self.curated_queue[:limit]
        return ShortsQueueResponse(queue=queue)

    async def fetch_from_youtube(
        self, query: str = "strength training", max_results: int = 10
    ) -> ShortsQueueResponse:
        """
        Fetch Shorts from YouTube Data API v3 (optional, requires API key)

        Uses Search: list endpoint with type=video & videoDuration=short
        Then Videos: list to get details

        https://developers.google.com/youtube/v3/docs/search/list
        https://developers.google.com/youtube/v3/docs/videos/list
        """
        if not self.api_key:
            print("[ShortsAPI] YouTube API key not configured, returning curated queue")
            return await self.get_curated_queue(max_results)

        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Search for Shorts
                search_url = "https://www.googleapis.com/youtube/v3/search"
                search_params = {
                    "part": "id",
                    "type": "video",
                    "videoDuration": "short",  # Filter for Shorts (< 60s)
                    "q": query,
                    "maxResults": max_results,
                    "key": self.api_key,
                }

                search_response = await client.get(search_url, params=search_params)
                search_data = search_response.json()

                if "items" not in search_data or not search_data["items"]:
                    print("[ShortsAPI] No videos found, returning curated queue")
                    return await self.get_curated_queue(max_results)

                video_ids = [item["id"]["videoId"] for item in search_data["items"]]

                # Step 2: Get video details (optional, to verify they're embeddable)
                videos_url = "https://www.googleapis.com/youtube/v3/videos"
                videos_params = {
                    "part": "status,contentDetails",
                    "id": ",".join(video_ids),
                    "key": self.api_key,
                }

                videos_response = await client.get(videos_url, params=videos_params)
                videos_data = videos_response.json()

                # Filter for embeddable videos
                embeddable_ids = [
                    video["id"]
                    for video in videos_data.get("items", [])
                    if video.get("status", {}).get("embeddable", False)
                ]

                print(f"[ShortsAPI] Fetched {len(embeddable_ids)} embeddable Shorts from YouTube")

                return ShortsQueueResponse(queue=embeddable_ids)

        except Exception as error:
            print(f"[ShortsAPI] Error fetching from YouTube: {error}")
            # Fallback to curated queue
            return await self.get_curated_queue(max_results)

    def add_to_curated_queue(self, video_id: str) -> None:
        """
        Add a videoId to the curated queue (for custom curation)
        """
        if video_id not in self.curated_queue:
            self.curated_queue.append(video_id)

    def remove_from_curated_queue(self, video_id: str) -> None:
        """
        Remove a videoId from the curated queue
        """
        self.curated_queue = [vid for vid in self.curated_queue if vid != video_id]

    def get_curated_queue_size(self) -> int:
        """
        Get curated queue size
        """
        return len(self.curated_queue)
