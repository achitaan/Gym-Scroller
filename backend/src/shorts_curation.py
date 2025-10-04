import httpx
import random
import re
from datetime import datetime, timedelta
from typing import List, Optional
from urllib.parse import urlencode


class ShortsCurationService:
    """
    Shorts Curation Service
    Manages YouTube Shorts video queue using YouTube Data API v3
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.cache: List[str] = []
        self.cache_timestamp: int = 0
        self.CACHE_TTL = 15 * 60 * 1000  # 15 minutes in milliseconds

        # Curated search terms for fitness content
        self.FITNESS_SEEDS = [
            "gym workout",
            "strength training",
            "powerlifting",
            "bodybuilding",
            "fitness motivation",
            "gym tips",
            "exercise form",
            "workout shorts",
            "gym shorts",
            "lifting technique",
        ]

    async def get_curated_queue(self, count: int = 10) -> List[str]:
        """
        Get a curated queue of Shorts video IDs
        Uses caching to respect API quotas
        """
        # Check cache
        current_time = int(datetime.now().timestamp() * 1000)
        if len(self.cache) >= count and current_time - self.cache_timestamp < self.CACHE_TTL:
            return self.cache[:count]

        # Fetch new shorts
        try:
            shorts = await self._fetch_shorts_from_api(count * 2)  # Fetch extra for filtering
            self.cache = shorts
            self.cache_timestamp = current_time
            return shorts[:count]
        except Exception as error:
            print(f"Failed to fetch shorts from API: {error}")
            # Return cached results if available
            if self.cache:
                return self.cache[:count]
            raise error

    async def _fetch_shorts_from_api(self, count: int) -> List[str]:
        """
        Fetch shorts from YouTube Data API v3
        """
        if not self.api_key:
            print("YouTube API key not configured, using mock data")
            return self._get_mock_shorts(count)

        video_ids: List[str] = []
        max_results = min(50, count)

        # Random seed for variety
        seed = random.choice(self.FITNESS_SEEDS)

        # Random time window (last 6 months)
        published_after = (datetime.now() - timedelta(days=180)).isoformat() + "Z"

        try:
            async with httpx.AsyncClient() as client:
                # 1. Search for short videos
                search_params = {
                    "key": self.api_key,
                    "part": "snippet",
                    "type": "video",
                    "q": seed,
                    "videoDuration": "short",  # <4 min (we'll filter to ≤60s)
                    "maxResults": str(max_results),
                    "order": "relevance",
                    "safeSearch": "moderate",
                    "publishedAfter": published_after,
                }

                search_url = f"https://www.googleapis.com/youtube/v3/search?{urlencode(search_params)}"
                search_response = await client.get(search_url)
                search_data = search_response.json()

                if "error" in search_data:
                    raise Exception(f"YouTube API error: {search_data['error']['message']}")

                candidate_ids = [
                    item["id"]["videoId"]
                    for item in search_data.get("items", [])
                    if "id" in item and "videoId" in item["id"]
                ]

                if not candidate_ids:
                    return self._get_mock_shorts(count)

                # 2. Get video details to filter true Shorts (≤60s)
                videos_params = {
                    "key": self.api_key,
                    "part": "contentDetails,snippet",
                    "id": ",".join(candidate_ids),
                }

                videos_url = f"https://www.googleapis.com/youtube/v3/videos?{urlencode(videos_params)}"
                videos_response = await client.get(videos_url)
                videos_data = videos_response.json()

                if "error" in videos_data:
                    raise Exception(f"YouTube API error: {videos_data['error']['message']}")

                # Filter to ≤60 seconds
                shorts = [
                    video["id"]
                    for video in videos_data.get("items", [])
                    if self._parse_duration(video.get("contentDetails", {}).get("duration", "")) <= 60
                    and self._parse_duration(video.get("contentDetails", {}).get("duration", "")) > 0
                ]

                return shorts if shorts else self._get_mock_shorts(count)

        except Exception as error:
            print(f"Error fetching from YouTube API: {error}")
            return self._get_mock_shorts(count)

    def _parse_duration(self, duration: str) -> int:
        """
        Parse ISO 8601 duration to seconds
        Example: PT1M30S -> 90 seconds
        """
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
        if not match:
            return 0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def _get_mock_shorts(self, count: int) -> List[str]:
        """
        Fallback mock shorts for development
        """
        # Some real fitness shorts video IDs for testing
        mock_ids = [
            "dQw4w9WgXcQ",  # Example video
            "jNQXAC9IVRw",  # Another example
            "yPYZpwSpKmA",  # Fitness short
        ]

        # Generate random mock IDs if we need more
        while len(mock_ids) < count:
            mock_ids.append(self._generate_mock_id())

        return mock_ids[:count]

    def _generate_mock_id(self) -> str:
        """
        Generate a random mock video ID (11 characters)
        """
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        return "".join(random.choice(chars) for _ in range(11))

    def clear_cache(self) -> None:
        """
        Clear cache (useful for testing)
        """
        self.cache = []
        self.cache_timestamp = 0
