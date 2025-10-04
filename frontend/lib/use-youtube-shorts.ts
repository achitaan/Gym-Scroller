"use client";

import { useState, useCallback, useRef } from "react";

export interface YouTubeShort {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  embedUrl: string;
}

export function useYouTubeShorts() {
  const [videos, setVideos] = useState<YouTubeShort[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchShort = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      return null;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/youtube", {
        cache: "no-store",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errorData.error || `Failed to fetch: ${res.status}`);
      }

      const data = await res.json();

      const video: YouTubeShort = {
        id: data.id,
        title: data.title,
        channelTitle: data.channelTitle,
        publishedAt: data.publishedAt,
        thumbnail: data.thumbnail,
        embedUrl: data.embedUrl,
      };

      setVideos(prev => [...prev, video]);
      return video;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error("Failed to fetch YouTube short:", errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const fetchMultiple = useCallback(async (count: number) => {
    const newVideos: YouTubeShort[] = [];

    for (let i = 0; i < count; i++) {
      const video = await fetchShort();
      if (video) {
        newVideos.push(video);
      }
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return newVideos;
  }, [fetchShort]);

  const clearVideos = useCallback(() => {
    setVideos([]);
    setError(null);
  }, []);

  return {
    videos,
    loading,
    error,
    fetchShort,
    fetchMultiple,
    clearVideos,
  };
}
