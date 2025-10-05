"use client";
import { useState, useEffect, useRef } from "react";

interface Video {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  embedUrl: string;
  error?: string;
}

export default function ShortsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Fetch a random video
  const fetchRandomVideo = async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const res = await fetch("/api/youtube", { cache: "no-store" });
      const text = await res.text();
      
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", text.slice(0, 200));
        return;
      }

      if (!res.ok) {
        console.error("API error:", data?.error || `Request failed: ${res.status}`);
        return;
      }

      setVideos(prev => [...prev, data]);
    } catch (err: any) {
      console.error("Fetch error:", err?.message || String(err));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Load initial video
  useEffect(() => {
    fetchRandomVideo();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, videos.length]);

  // Scroll to current video
  useEffect(() => {
    if (containerRef.current) {
      const videoElements = containerRef.current.children;
      if (videoElements[currentIndex]) {
        videoElements[currentIndex].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Load next video if at the end
      fetchRandomVideo();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Touch support for mobile swipe
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <div 
      className="h-screen w-full overflow-hidden bg-black relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {videos.map((video, index) => (
        <div
          key={`${video.id}-${index}`}
          className="h-screen w-full flex items-center justify-center relative snap-start"
        >
          {/* Video iframe */}
          <div className="w-full h-full max-w-[500px] mx-auto relative">
            <iframe
              src={`${video.embedUrl}?autoplay=${index === currentIndex ? 1 : 0}&controls=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {/* Video info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h2 className="text-lg font-semibold mb-1 line-clamp-2">{video.title}</h2>
              <p className="text-sm text-gray-300">{video.channelTitle}</p>
              <a
                href={`https://youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/80 hover:text-white mt-2 inline-block"
              >
                Open on YouTube →
              </a>
            </div>
          </div>

          {/* Navigation indicators */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 text-white/70">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
              aria-label="Previous video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 backdrop-blur-sm"
              aria-label="Next video"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Video counter */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
            {index + 1} / {videos.length}
          </div>
        </div>
      ))}

      {/* Loading initial video */}
      {videos.length === 0 && loading && (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p>Loading your first short...</p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm">
        <p className="font-semibold mb-1">Controls:</p>
        <p>↑↓ Arrow keys or swipe to navigate</p>
      </div>
    </div>
  );
}
