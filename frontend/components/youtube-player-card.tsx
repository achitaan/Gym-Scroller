'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YT {
  Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

interface YTPlayerConfig {
  height?: string;
  width?: string;
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    mute?: 0 | 1;
    playsinline?: 0 | 1;
    modestbranding?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    origin?: string;
    widget_referrer?: string;
    enablejsapi?: 0 | 1;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { target: YTPlayer; data: number }) => void;
    onError?: (event: { target: YTPlayer; data: number }) => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
}

export type PlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

interface PlayerCardProps {
  videoId: string;
  autoplay?: boolean;
  onReady?: () => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: number) => void;
  className?: string;
}

export function PlayerCard({
  videoId,
  autoplay = false,
  onReady,
  onStateChange,
  onError,
  className = '',
}: PlayerCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>('unstarted');
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const playerIdRef = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load the API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Map YT.PlayerState to our PlayerState type
  const mapPlayerState = useCallback((state: number): PlayerState => {
    switch (state) {
      case -1:
        return 'unstarted';
      case 0:
        return 'ended';
      case 1:
        return 'playing';
      case 2:
        return 'paused';
      case 3:
        return 'buffering';
      case 5:
        return 'cued';
      default:
        return 'unstarted';
    }
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current || !videoId) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const player = new window.YT.Player(playerIdRef.current, {
      height: '100%',
      width: '100%',
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        mute: 1, // Start muted for autoplay policy compliance
        playsinline: 1,
        modestbranding: 1,
        controls: 1,
        rel: 0,
        origin,
        widget_referrer: origin,
        enablejsapi: 1,
      },
      events: {
        onReady: (event) => {
          playerRef.current = event.target;
          onReady?.();

          // Attempt autoplay (muted)
          if (autoplay) {
            try {
              event.target.playVideo();
            } catch (err) {
              console.warn('[PlayerCard] Autoplay failed:', err);
              setShowPlayOverlay(true);
            }
          }
        },
        onStateChange: (event) => {
          const state = mapPlayerState(event.data);
          setPlayerState(state);
          onStateChange?.(state);

          // Hide overlay when playing
          if (state === 'playing') {
            setShowPlayOverlay(false);
          }
        },
        onError: (event) => {
          console.error('[PlayerCard] Player error:', event.data);
          onError?.(event.data);

          // Error codes: 2 = invalid param, 5 = HTML5 error, 100 = not found, 101/150 = embed not allowed
          if (event.data === 101 || event.data === 150) {
            setEmbedError(true);
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.warn('[PlayerCard] Error destroying player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [isAPIReady, videoId, autoplay, onReady, onStateChange, onError, mapPlayerState]);

  // Public methods via ref (exposed via parent component if needed)
  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const mute = useCallback(() => {
    playerRef.current?.mute();
  }, []);

  const unMute = useCallback(() => {
    playerRef.current?.unMute();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const load = useCallback((newVideoId: string) => {
    playerRef.current?.loadVideoById(newVideoId);
  }, []);

  // Handle manual play tap (for autoplay fallback)
  const handlePlayTap = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
      // Optionally unmute on user gesture
      playerRef.current.unMute();
    }
  };

  // Handle "Open in YouTube" tap
  const handleOpenYouTube = () => {
    window.open(`https://youtu.be/${videoId}`, '_blank');
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className}`}>
      {/* YouTube player container */}
      <div id={playerIdRef.current} className="absolute inset-0" />

      {/* Autoplay fallback overlay */}
      {showPlayOverlay && !embedError && (
        <button
          onClick={handlePlayTap}
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10"
          aria-label="Play video"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-10 h-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Embed blocked fallback */}
      {embedError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 p-6 text-center">
          <p className="text-white text-lg mb-4">This video can't be embedded</p>
          <button
            onClick={handleOpenYouTube}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium"
          >
            Open in YouTube
          </button>
        </div>
      )}
    </div>
  );
}

// Export a version with imperative handle for advanced control
export interface PlayerCardHandle {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (seconds: number) => void;
  load: (videoId: string) => void;
  getPlayerState: () => PlayerState;
}

export const PlayerCardWithHandle = React.forwardRef<PlayerCardHandle, PlayerCardProps>(
  (props, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState>('unstarted');

    React.useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      mute: () => playerRef.current?.mute(),
      unMute: () => playerRef.current?.unMute(),
      seekTo: (seconds: number) => playerRef.current?.seekTo(seconds, true),
      load: (videoId: string) => playerRef.current?.loadVideoById(videoId),
      getPlayerState: () => playerState,
    }));

    return <PlayerCard {...props} onStateChange={setPlayerState} />;
  }
);

PlayerCardWithHandle.displayName = 'PlayerCardWithHandle';
