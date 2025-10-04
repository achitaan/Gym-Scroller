"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYouTubeShorts } from "@/lib/use-youtube-shorts";

interface RestPeriodShortsProps {
  isActive: boolean;
  onClose?: () => void;
}

/**
 * RestPeriodShorts displays a YouTube short during rest periods
 * Hevy UX pattern: Keep users engaged during rest with entertaining content
 */
export function RestPeriodShorts({ isActive, onClose }: RestPeriodShortsProps) {
  const { videos, loading, fetchShort } = useYouTubeShorts();
  const [currentVideo, setCurrentVideo] = useState(0);

  // Fetch first video when activated
  useEffect(() => {
    if (isActive && videos.length === 0 && !loading) {
      fetchShort();
    }
  }, [isActive, videos.length, loading, fetchShort]);

  const handleNext = async () => {
    if (currentVideo < videos.length - 1) {
      setCurrentVideo(currentVideo + 1);
    } else {
      await fetchShort();
      setCurrentVideo(videos.length);
    }
  };

  if (!isActive) return null;

  const video = videos[currentVideo];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Video player */}
      {video ? (
        <div className="w-full h-full max-w-[500px] mx-auto flex flex-col">
          <div className="flex-1 relative">
            <iframe
              src={`${video.embedUrl}?autoplay=1&controls=1&modestbranding=1&rel=0&loop=1&playlist=${video.id}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video info */}
          <div className="p-4 text-white">
            <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
            <p className="text-sm text-gray-400">{video.channelTitle}</p>
          </div>

          {/* Controls */}
          <div className="p-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Next Short"
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={onClose}
            >
              Back to Workout
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center text-white">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading short...</p>
        </div>
      )}
    </div>
  );
}
