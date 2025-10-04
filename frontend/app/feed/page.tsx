"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Unlock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useYouTubeShorts } from "@/lib/use-youtube-shorts";

/**
 * Feed Page - YouTube Shorts during rest periods
 * Hevy UX pattern: Entertainment during rest to keep users engaged
 * Can be rep-locked (advance only on valid reps) or free scroll
 */
export default function FeedPage() {
  const router = useRouter();
  const { videos, loading, error, fetchShort, fetchMultiple } = useYouTubeShorts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepLocked, setIsRepLocked] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Load initial videos on mount
  useEffect(() => {
    fetchMultiple(3); // Load 3 initial videos
  }, []);

  // Auto-scroll to current video
  useEffect(() => {
    if (containerRef.current && videos.length > 0) {
      const cardHeight = window.innerHeight;
      containerRef.current.scrollTo({
        top: currentIndex * cardHeight,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  // Preload next video when approaching the end
  useEffect(() => {
    if (currentIndex >= videos.length - 2 && !loading) {
      fetchShort();
    }
  }, [currentIndex, videos.length, loading, fetchShort]);

  const handleScroll = () => {
    if (isRepLocked && !isResting) {
      // Prevent manual scroll during rep-lock
      return;
    }

    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const cardHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / cardHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Touch support for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isRepLocked && !isResting) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Failed to load videos</h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          <Button onClick={() => fetchShort()} disabled={loading}>
            {loading ? "Loading..." : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 rounded-full backdrop-blur-md bg-black/60 text-white hover:bg-black/80"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Rep-locked badge */}
      {isRepLocked && !isResting && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full backdrop-blur-md bg-blue-600/90 flex items-center gap-2">
          <Lock className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Rep-locked</span>
        </div>
      )}

      {/* Rest-unlocked banner */}
      {isResting && isRepLocked && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 p-3 text-center">
          <p className="text-sm font-medium text-white">
            <Unlock className="inline h-4 w-4 mr-1" />
            Rest-unlocked • Free scrolling enabled
          </p>
        </div>
      )}

      {/* Video counter */}
      {videos.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      )}

      {/* Shorts scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          overflowY: isRepLocked && !isResting ? "hidden" : "scroll",
        }}
      >
        {videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className="h-screen w-full snap-start snap-always flex items-center justify-center relative"
          >
            {/* Video iframe */}
            <div className="w-full h-full max-w-[500px] mx-auto relative">
              <iframe
                src={`${video.embedUrl}?autoplay=${index === currentIndex ? 1 : 0}&controls=1&modestbranding=1&rel=0&loop=1&playlist=${video.id}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Video info overlay */}
              <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h2 className="text-lg font-semibold mb-1 line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-sm text-gray-300">{video.channelTitle}</p>
              </div>
            </div>

            {/* Navigation indicators */}
            {!isRepLocked && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-white"
                >
                  ↑
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= videos.length - 1 && loading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 backdrop-blur-sm text-white"
                >
                  {loading && currentIndex >= videos.length - 1 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    "↓"
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading initial videos */}
      {videos.length === 0 && loading && (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="text-center text-white">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading shorts...</p>
          </div>
        </div>
      )}

      {/* Debug controls (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setIsRepLocked(!isRepLocked)}
            className={`flex-1 py-2 px-4 rounded-lg backdrop-blur-md text-sm font-medium ${
              isRepLocked ? "bg-blue-600/90" : "bg-black/60"
            } text-white`}
          >
            {isRepLocked ? "Rep-Locked" : "Free Scroll"}
          </button>
          <button
            onClick={() => setIsResting(!isResting)}
            className={`flex-1 py-2 px-4 rounded-lg backdrop-blur-md text-sm font-medium ${
              isResting ? "bg-orange-500/90" : "bg-black/60"
            } text-white`}
          >
            {isResting ? "Resting" : "In Set"}
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <Navbar />

      {/* Hide scrollbar */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
