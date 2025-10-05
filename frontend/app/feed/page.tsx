"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Unlock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useYouTubeShorts } from "@/lib/use-youtube-shorts";
import { useAdManager } from "@/lib/use-ad-manager";
import { AdOverlay } from "@/components/AdOverlay";
import { useSearchParams } from 'next/navigation';

/**
 * Feed Page - YouTube Shorts during rest periods
 * Hevy UX pattern: Entertainment during rest to keep users engaged
 * Can be rep-locked (advance only on valid reps) or free scroll
 */
export default function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incomingPreset, setIncomingPreset] = useState<null | { exercises: Array<{ exercise: any; sets?: Array<{ weightKg?: number }> }> }>(null);
  const [currentReps, setCurrentReps] = useState(0);
  const { videos, loading, error, fetchShort, fetchMultiple } = useYouTubeShorts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepLocked, setIsRepLocked] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicStart, setMusicStart] = useState<number>(0);
  const musicFallbackTriedRef = useRef(false);

  // Ad system integration
  const {
    currentAd,
    isAdShowing,
    pausedVideoIndex,
    showAd,
    handleAdClick,
    clearPausedIndex,
  } = useAdManager();

  // Function to trigger an ad (targeted search video)
  const triggerAd = async () => {
    try {
      const response = await fetch("/api/youtube?ads=true", {
        cache: "no-store",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ad: ${response.status}`);
      }

      const adVideo = await response.json();
      
      console.log("🎯 Ad video fetched:", adVideo);
      console.log(`⏱️ Video duration: ${adVideo.duration} seconds`);
      
      // Optional: You could show this as an overlay or add it to the feed
      // For example, using your existing ad system:
      if (adVideo) {
        const adData = {
          id: `ad-${Date.now()}`,
          type: 'video' as const,
          content: adVideo.embedUrl,
          duration: adVideo.duration ? adVideo.duration * 1000 : 30000, // Use actual video duration in milliseconds, fallback to 30s
          title: adVideo.title,
          clickUrl: `https://youtube.com/watch?v=${adVideo.id}`,
          impressionId: `imp-${Date.now()}`,
        };
        showAd(adData, currentIndex);
      }
    } catch (error) {
      console.error("Failed to trigger ad:", error);
    }
  };

  // Load initial videos on mount
  useEffect(() => {
    fetchMultiple(3); // Load 3 initial videos
  }, []);

  // Decode incoming preset from query param (if present)
  useEffect(() => {
    try {
      const b64 = searchParams.get('preset');
      if (!b64) return;
      const json = decodeURIComponent(escape(window.atob(b64)));
      const parsed = JSON.parse(json);
      if (parsed && parsed.exercises) {
        setIncomingPreset(parsed);
        // When a workout starts via preset, try to load a random mp3
        const startParam = searchParams.get('musicStart');
        if (startParam) {
          const parts = startParam.split(':').map(Number);
          if (parts.length === 2 && parts.every(n => !isNaN(n))) setMusicStart(parts[0] * 60 + parts[1]);
          else if (!isNaN(Number(startParam))) setMusicStart(Number(startParam));
        }
        const specific = searchParams.get('musicFile');
        if (specific) {
          const url = `/music/${specific}`;
          setMusicUrl(url);
        } else {
          // Default to the lofi track; if it fails, we'll fallback via audio error handler
          const defaultUrl = '/music/10-minutes-relax-and-study-with-me.mp3';
          setMusicUrl(defaultUrl);
        }
      }
    } catch (e) {
      console.warn('Failed to decode preset', e);
    }
  }, [searchParams]);

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

  // Resume video after ad is dismissed
  useEffect(() => {
    if (!isAdShowing && pausedVideoIndex !== null) {
      setCurrentIndex(pausedVideoIndex);
      clearPausedIndex();
    }
  }, [isAdShowing, pausedVideoIndex, clearPausedIndex]);

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
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
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

  // Send YouTube player API command to the current iframe
  const sendYTCommand = (idx: number, func: string, args: any[] = []) => {
    const iframe = iframeRefs.current[idx];
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  // Unlock audio on first real user interaction (required by browser policies)
  useEffect(() => {
    // Initialize from persisted setting
    if (!audioUnlocked) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('audioUnlocked') : null;
        if (stored === 'true') {
          setAudioUnlocked(true);
        }
      } catch {}
    }

    if (audioUnlocked) return;
    const unlock = () => {
      setAudioUnlocked(true);
      try { localStorage.setItem('audioUnlocked', 'true'); } catch {}
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock as any);
      window.removeEventListener('keydown', unlock as any);
    };
  }, [audioUnlocked]);

  // When we have a music URL and audio is unlocked, try to play it; if it fails, fallback to a random track once
  useEffect(() => {
    if (!musicUrl) return;
    if (!audioUnlocked) return;
    const el = audioEl.current;
    if (!el) return;
    const onError = async () => {
      if (musicFallbackTriedRef.current) return;
      musicFallbackTriedRef.current = true;
      try {
        const r = await fetch('/api/music/list', { cache: 'no-store' });
        const j = await r.json();
        const arr: string[] = j?.files || [];
        if (arr.length > 0) {
          // Try to pick best match for "lofi relax study 10"
          const keys = ['lofi', 'relax', 'study', '10'];
          const best = arr
            .map((u) => ({ u, name: decodeURIComponent(u.split('/').pop() || '').toLowerCase() }))
            .sort((a, b) => {
              const score = (n: string) => keys.reduce((s, k) => s + (n.includes(k) ? 1 : 0), 0);
              return score(b.name) - score(a.name);
            })[0];
          if (best) setMusicUrl(best.u);
          else setMusicUrl(arr[Math.floor(Math.random() * arr.length)]);
        } else {
          console.warn('No MP3s found under /public/music');
        }
      } catch {}
    };
    const onLoaded = async () => {
      try {
        el.currentTime = Math.max(0, musicStart || 0);
        await el.play();
      } catch {
        // ignored
      }
    };
    const play = async () => {
      try {
        el.pause();
        el.src = musicUrl;
        el.removeEventListener('error', onError as any);
        el.removeEventListener('loadedmetadata', onLoaded as any);
        el.addEventListener('error', onError as any, { once: true });
        el.addEventListener('loadedmetadata', onLoaded as any, { once: true });
        // If metadata already available, attempt immediate play
        if (el.readyState >= 1) {
          await onLoaded();
        }
      } catch (e) {
        // ignored; user can tap to start
      }
    };
    play();
    return () => {
      if (el) {
        el.removeEventListener('error', onError as any);
        el.removeEventListener('loadedmetadata', onLoaded as any);
      }
    };
  }, [musicUrl, audioUnlocked, musicStart]);

  // As soon as audio is unlocked and preference is unmuted, unmute the current video (allow alongside our music)
  useEffect(() => {
    if (isAdShowing) return; // don't affect feed while ad is showing
    if (audioUnlocked) {
      sendYTCommand(currentIndex, 'unMute');
      sendYTCommand(currentIndex, 'setVolume', [100]);
      sendYTCommand(currentIndex, 'playVideo');
    }
  }, [audioUnlocked, currentIndex, isAdShowing]);

  // Robust autoplay: attempt to play the active video shortly after render/scroll
  useEffect(() => {
    if (isAdShowing) return; // don't auto-play feed while ad is shown
    const timeouts = [100, 400, 1000].map((t) => setTimeout(() => {
      // Only force mute if audio hasn't been unlocked yet (autoplay policies)
      if (!audioUnlocked) {
        sendYTCommand(currentIndex, 'mute');
      }
      sendYTCommand(currentIndex, 'playVideo');
      // If audio is unlocked, unmute
      if (audioUnlocked) {
        sendYTCommand(currentIndex, 'unMute');
        sendYTCommand(currentIndex, 'setVolume', [100]);
      }
    }, t));
    return () => { timeouts.forEach((id) => clearTimeout(id)); };
  }, [currentIndex, hasUserInteracted, audioUnlocked, isAdShowing]);

  // Pause the feed video when an ad starts showing
  useEffect(() => {
    if (isAdShowing) {
      const idx = pausedVideoIndex ?? currentIndex;
      sendYTCommand(idx, 'pauseVideo');
    }
  }, [isAdShowing, pausedVideoIndex, currentIndex]);

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
        className="fixed top-4 left-4 z-50 rounded-full backdrop-blur-md bg-black/60 text-neutral-100 hover:bg-black/80"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Rep-locked badge */}
      {isRepLocked && !isResting && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full backdrop-blur-md bg-white/20 flex items-center gap-2">
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-neutral-100 text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      )}

      {/* Incoming preset summary (special instance) */}
      {incomingPreset && (
  <div className="fixed top-16 left-4 z-50 p-3 rounded-lg bg-white/6 backdrop-blur-md text-neutral-100 w-80 max-w-[calc(50vw-2rem)]">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Starting Workout</div>
            <div className="text-sm text-neutral-300">{incomingPreset.exercises.length} exercises</div>
          </div>
          
          {/* Rep Counter */}
          <div className="mb-3 p-2 rounded bg-white/10 text-center">
            <div className="text-2xl font-bold tabular-nums">{currentReps}</div>
            <div className="text-xs text-neutral-300">Reps</div>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
            {incomingPreset.exercises.map((ex: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="text-sm font-medium">{ex.exercise.name}</div>
                <div className="text-xs text-neutral-300">
                  {ex.sets?.length ?? 0} sets • {ex.sets && ex.sets.length > 0 ? `${ex.sets.map((s: any) => (s.weightKg ? `${s.weightKg}kg` : '—')).join(', ')}` : 'No weights'}
                </div>
              </div>
            ))}
          </div>
          
          {/* End Workout Button */}
          <button
            onClick={() => {
              try {
                // Prepare workout summary data with per-set rep counts
                // For now, we'll simulate completed reps per set
                // Later this can be updated with actual tracking
                const exercisesWithReps = incomingPreset.exercises.map(ex => ({
                  ...ex,
                  sets: ex.sets?.map(set => ({
                    ...set,
                    repsCompleted: Math.floor(Math.random() * 12) + 8 // Simulate 8-20 reps per set for now
                  }))
                }));

                const summaryData = {
                  exercises: exercisesWithReps,
                  totalReps: currentReps,
                  duration: null, // Can add duration tracking later
                };
                
                // Encode summary data
                const payload = JSON.stringify(summaryData);
                const b64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(payload))) : '';
                
                // Navigate to workout summary
                router.push(`/workout-summary?data=${encodeURIComponent(b64)}`);
              } catch (e) {
                // Fallback: navigate without data
                router.push('/workout-summary');
              }
            }}
            className="w-full py-2 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-neutral-100 text-sm font-medium transition-colors"
          >
            End Workout
          </button>
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
            data-video-index={index}
            className="h-screen w-full snap-start snap-always flex items-center justify-center relative"
          >
            {/* Video iframe */}
            <div className="w-full h-full max-w-[500px] mx-auto relative">
              <iframe
                key={`iframe-${video.id}-${index === currentIndex ? 'active' : 'inactive'}-${hasUserInteracted ? 'interacted' : 'initial'}-${audioUnlocked ? 'unlocked' : 'locked'}`}
                ref={(el) => {
                  iframeRefs.current[index] = el;
                }}
                src={index === currentIndex 
                  ? `${video.embedUrl}?autoplay=1&mute=${audioUnlocked ? 0 : 1}&controls=1&modestbranding=1&rel=0&loop=1&playlist=${video.id}&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
                  : `${video.embedUrl}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`
                }
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              {/* Click to play overlay for first interaction */}
              {!hasUserInteracted && index === currentIndex && (
                <div 
                  className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer z-10"
                  onClick={() => setHasUserInteracted(true)}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Video info overlay */}
              <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-neutral-100">
                <h2 className="text-lg font-semibold mb-1 line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-sm text-gray-300">{video.channelTitle}</p>
              </div>

              {/* No custom sound toggle; rely on default YouTube controls */}
            </div>

            {/* Navigation indicators */}
            {!isRepLocked && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-neutral-100"
                >
                  ↑
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= videos.length - 1 && loading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 backdrop-blur-sm text-neutral-100"
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

      {/* Debug controls removed (was a full-width bar in dev) */}

      {/* Debug controls (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={triggerAd}
          disabled={loading}
          className="fixed bottom-24 right-4 z-50 py-2 px-3 rounded-lg backdrop-blur-md bg-green-600/90 text-white text-xs font-medium disabled:opacity-50"
        >
          {loading ? "..." : "🎯"}
        </button>
      )}

      {/* Bottom Navigation */}
  <Navbar />

  {/* Hidden audio element for workout music (no UI) */}
  <audio ref={audioEl} autoPlay playsInline preload="auto" style={{ display: 'none' }} />

      {/* Ad Overlay */}
      {isAdShowing && currentAd && (
        <AdOverlay ad={currentAd} onAdClick={handleAdClick} />
      )}

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
