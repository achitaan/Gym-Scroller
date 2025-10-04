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
  const lastCallTimeRef = useRef<number>(0);

  const fetchShort = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      return null;
    }

    // Enforce minimum 100ms delay between successive API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const minDelay = 100; // 0.1 seconds

    if (timeSinceLastCall < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastCall));
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
      lastCallTimeRef.current = Date.now(); // Update last call timestamp
      return video;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error("Failed to fetch YouTube short:", errorMsg);
      setError(errorMsg);
      lastCallTimeRef.current = Date.now(); // Update even on error
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
