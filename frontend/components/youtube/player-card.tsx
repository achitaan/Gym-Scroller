"use client"

import { useEffect, useRef, useState } from "react"

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface YT {
  Player: new (elementId: string, options: YT.PlayerOptions) => YT.Player
  PlayerState: {
    UNSTARTED: number
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

namespace YT {
  export interface PlayerOptions {
    videoId: string
    playerVars?: PlayerVars
    events?: Events
  }

  export interface PlayerVars {
    autoplay?: 0 | 1
    mute?: 0 | 1
    playsinline?: 0 | 1
    modestbranding?: 0 | 1
    controls?: 0 | 1
    rel?: 0 | 1
    origin?: string
    widget_referrer?: string
  }

  export interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: PlayerEvent) => void
    onError?: (event: PlayerEvent) => void
  }

  export interface PlayerEvent {
    target: Player
    data?: number
  }

  export interface Player {
    playVideo(): void
    pauseVideo(): void
    mute(): void
    unMute(): void
    isMuted(): boolean
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getPlayerState(): number
    loadVideoById(videoId: string): void
    destroy(): void
  }
}

interface PlayerCardProps {
  videoId: string
  autoplay?: boolean
  onReady?: (player: YT.Player) => void
  onStateChange?: (state: number) => void
  onError?: (error: any) => void
  className?: string
}

export function PlayerCard({
  videoId,
  autoplay = false,
  onReady,
  onStateChange,
  onError,
  className = "",
}: PlayerCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const [isApiReady, setIsApiReady] = useState(false)
  const [playerState, setPlayerState] = useState<number>(-1)
  const [isMuted, setIsMuted] = useState(true)

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true)
      return
    }

    // Load the API script
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true)
    }

    return () => {
      window.onYouTubeIframeAPIReady = () => {}
    }
  }, [])

  // Create player when API is ready
  useEffect(() => {
    if (!isApiReady || !containerRef.current || !videoId) return

    const playerId = `youtube-player-${Math.random().toString(36).substr(2, 9)}`
    containerRef.current.id = playerId

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const widgetReferrer = typeof window !== "undefined" ? window.location.href : ""

    playerRef.current = new window.YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        mute: 1, // Always start muted for autoplay compliance
        playsinline: 1,
        modestbranding: 1,
        controls: 1,
        rel: 0,
        origin,
        widget_referrer: widgetReferrer,
      },
      events: {
        onReady: (event) => {
          if (onReady) onReady(event.target)
        },
        onStateChange: (event) => {
          setPlayerState(event.data ?? -1)
          if (onStateChange && typeof event.data === "number") {
            onStateChange(event.data)
          }
        },
        onError: (event) => {
          if (onError) onError(event)
        },
      },
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [isApiReady, videoId, autoplay, onReady, onStateChange, onError])

  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }

  const handleMute = () => {
    if (playerRef.current) {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      handleUnmute()
    } else {
      handleMute()
    }
  }

  const isPlaying = playerState === 1 // YT.PlayerState.PLAYING

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Unmute overlay - shows when video is muted */}
      {isMuted && isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium hover:bg-black/80 transition-colors z-10"
          aria-label="Unmute video"
        >
          Tap to unmute 🔊
        </button>
      )}

      {/* Mute button when unmuted */}
      {!isMuted && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          aria-label="Mute video"
        >
          🔇
        </button>
      )}
    </div>
  )
}

// Export a hook to control player from parent
export function usePlayerControl(player: YT.Player | null) {
  const play = () => player?.playVideo()
  const pause = () => player?.pauseVideo()
  const mute = () => player?.mute()
  const unMute = () => player?.unMute()
  const seekTo = (seconds: number) => player?.seekTo(seconds, true)
  const getState = () => player?.getPlayerState() ?? -1
  const loadVideo = (videoId: string) => player?.loadVideoById(videoId)

  return { play, pause, mute, unMute, seekTo, getState, loadVideo }
}
