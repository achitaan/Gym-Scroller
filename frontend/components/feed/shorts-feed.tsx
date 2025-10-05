"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PlayerCard, usePlayerControl } from "@/components/youtube/player-card"
import { useSocket } from "@/lib/socket-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, X, ArrowLeft } from "lucide-react"

interface ShortsVideo {
  id: string
  title?: string
  channelTitle?: string
}

interface ShortsFeedProps {
  onBackToTrain?: () => void
  isInRestPeriod?: boolean
}

export function ShortsFeed({ onBackToTrain, isInRestPeriod = false }: ShortsFeedProps) {
  const { sensorState, subscribeToSensorData } = useSocket()
  const [videos, setVideos] = useState<ShortsVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Map<number, YT.Player>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSensorStateRef = useRef<string | null>(null)

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        // Try to fetch a batch from the queue
        const videoPromises = []
        for (let i = 0; i < 5; i++) {
          videoPromises.push(fetch("/api/youtube", { cache: "no-store" }))
        }

        const responses = await Promise.all(videoPromises)
        const data = await Promise.all(
          responses.map(async (res) => {
            if (!res.ok) return null
            const json = await res.json()
            return { id: json.id, title: json.title, channelTitle: json.channelTitle }
          })
        )

        const validVideos = data.filter((v): v is ShortsVideo => v !== null)
        setVideos(validVideos)
      } catch (err) {
        console.error("Failed to load shorts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // Listen for concentric phase to advance
  useEffect(() => {
    const unsubscribe = subscribeToSensorData((state) => {
      // Advance when transitioning to concentric phase (lifting motion detected)
      if (state === 'concentric' && lastSensorStateRef.current !== 'concentric') {
        console.log('🏋️ Concentric detected - advancing to next short');
        advanceToNext()
      }
      lastSensorStateRef.current = state
    })

    return () => unsubscribe()
  }, [currentIndex, videos.length, subscribeToSensorData])

  // Scroll to current video
  useEffect(() => {
    if (containerRef.current) {
      const videoElements = containerRef.current.children
      if (videoElements[currentIndex]) {
        videoElements[currentIndex].scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }
  }, [currentIndex])

  // Pause all players except current
  useEffect(() => {
    players.forEach((player, index) => {
      if (index === currentIndex) {
        // Play current video
        try {
          player.playVideo()
        } catch (e) {
          // Player might not be ready
        }
      } else {
        // Pause others
        try {
          player.pauseVideo()
        } catch (e) {
          // Player might not be ready
        }
      }
    })
  }, [currentIndex, players])

  const advanceToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Load more videos
      fetchMoreVideos()
    }
  }

  const fetchMoreVideos = async () => {
    try {
      const res = await fetch("/api/youtube", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        const newVideo: ShortsVideo = { id: json.id, title: json.title, channelTitle: json.channelTitle }
        setVideos((prev) => [...prev, newVideo])
        setCurrentIndex((prev) => prev + 1)
      }
    } catch (err) {
      console.error("Failed to load next short:", err)
    }
  }

  const handlePlayerReady = (index: number, player: YT.Player) => {
    setPlayers((prev) => {
      const newMap = new Map(prev)
      newMap.set(index, player)
      return newMap
    })
  }

  // Touch/scroll interactions disabled - advancement only via concentric sensor state

  if (loading && videos.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your Shorts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-black relative">
      {/* Back to Train button */}
      {onBackToTrain && (
        <button
          onClick={onBackToTrain}
          className="absolute top-4 left-4 z-20 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium hover:bg-black/80 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Back to Train
        </button>
      )}

      {/* Sensor status badge */}
      <div className="absolute top-4 right-4 z-20">
        <Badge className="bg-success/90 text-white border-success/20 backdrop-blur-sm flex items-center gap-2 px-3 py-2">
          <Zap className="w-4 h-4" strokeWidth={2} />
          Sensor-Controlled
        </Badge>
      </div>

      {/* Video container - no scroll, controlled by sensor */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden"
      >
        {videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className="h-screen w-full flex items-center justify-center relative snap-start"
          >
            <div className="w-full h-full max-w-[500px] mx-auto">
              <PlayerCard
                videoId={video.id}
                autoplay={index === currentIndex}
                onReady={(player) => handlePlayerReady(index, player)}
                className="w-full h-full"
              />
            </div>

            {/* Video info overlay */}
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white pointer-events-none">
              {video.title && (
                <>
                  <h2 className="text-lg font-semibold mb-1 line-clamp-2">{video.title}</h2>
                  {video.channelTitle && <p className="text-sm text-gray-300">{video.channelTitle}</p>}
                </>
              )}
            </div>

            {/* Concentric sensor indicator on current video */}
            {index === currentIndex && (
              <div className="absolute bottom-32 left-0 right-0 px-4 pointer-events-none">
                <div className="bg-success/20 backdrop-blur-sm border border-success/40 rounded-lg p-3 text-center text-white">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-success" strokeWidth={2} />
                  <p className="text-sm font-medium">Start lifting (concentric) to advance</p>
                  {sensorState && (
                    <p className="text-xs mt-1 text-gray-300">
                      Current: {sensorState}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video counter */}
      <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm z-10">
        {currentIndex + 1} / {videos.length}
      </div>
    </div>
  )
}
