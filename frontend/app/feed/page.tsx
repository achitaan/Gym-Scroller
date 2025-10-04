'use client';

import { useState, useEffect, useRef } from 'react';
import { tokens } from '@/lib/design-tokens';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';
import { PlayerCard } from '@/components/youtube-player-card';
import { useSocket } from '@/lib/socket-context';
import Link from 'next/link';

export default function FeedPage() {
  const { shortsQueue, subscribeToReps } = useSocket();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepLocked, setIsRepLocked] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<Map<number, any>>(new Map());

  // Mock queue if no socket data
  const videoQueue = shortsQueue.length > 0 ? shortsQueue : [
    'jfKfPfyJRdk', // Example YouTube Shorts IDs
    'sDvf4qX3rbs',
    'mCdA4bJAGGk',
  ];

  // Subscribe to rep events for rep-locked advancement
  useEffect(() => {
    if (!isRepLocked || isResting) return;

    const unsubscribe = subscribeToReps((rep) => {
      if (rep.valid) {
        // Advance to next video on valid rep
        handleAdvance();
      }
    });

    return unsubscribe;
  }, [isRepLocked, isResting, subscribeToReps]);

  const handleAdvance = () => {
    if (currentIndex < videoQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      // Pause current video
      const currentPlayer = playersRef.current.get(currentIndex);
      if (currentPlayer) {
        // Player will auto-pause when scrolled out of view
      }
    }
  };

  const handleScroll = () => {
    if (isRepLocked && !isResting) {
      // Prevent manual scroll during rep-lock
      return;
    }

    // Snap to nearest card
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const cardHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / cardHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videoQueue.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  useEffect(() => {
    // Auto-scroll to current index
    if (containerRef.current) {
      const cardHeight = window.innerHeight;
      containerRef.current.scrollTo({
        top: currentIndex * cardHeight,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <div className="relative h-screen overflow-hidden" style={{ backgroundColor: tokens.colors.background.primary }}>
      {/* Back to Train affordance */}
      <Link href="/train">
        <button
          className="fixed top-4 left-4 z-50 p-3 rounded-full backdrop-blur-md active:opacity-70"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            minWidth: tokens.touchTarget.min,
            minHeight: tokens.touchTarget.min,
          }}
        >
          <ArrowLeft size={24} style={{ color: tokens.colors.text.primary }} />
        </button>
      </Link>

      {/* Rep-locked badge */}
      {isRepLocked && !isResting && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)' }}
        >
          <Lock size={16} style={{ color: tokens.colors.text.primary }} />
          <span className="text-sm font-medium" style={{ color: tokens.colors.text.primary }}>
            Rep-locked
          </span>
        </div>
      )}

      {/* Rest-unlocked banner */}
      {isResting && isRepLocked && (
        <div
          className="fixed top-0 left-0 right-0 z-50 p-3 text-center"
          style={{ backgroundColor: tokens.colors.accent.warning }}
        >
          <p className="text-sm font-medium" style={{ color: tokens.colors.background.primary }}>
            <Unlock size={14} className="inline mr-1" />
            Rest-unlocked • Free scrolling enabled
          </p>
        </div>
      )}

      {/* Shorts scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          overflowY: isRepLocked && !isResting ? 'hidden' : 'scroll',
        }}
      >
        {videoQueue.map((videoId, index) => (
          <div
            key={`${videoId}-${index}`}
            className="h-screen w-full snap-start snap-always flex items-center justify-center"
            style={{ scrollSnapAlign: 'start' }}
          >
            <PlayerCard
              videoId={videoId}
              autoplay={index === currentIndex}
              onReady={() => {
                console.log(`[Feed] Video ${index} ready`);
              }}
              onStateChange={(state) => {
                console.log(`[Feed] Video ${index} state:`, state);
              }}
              onError={(error) => {
                console.error(`[Feed] Video ${index} error:`, error);
              }}
              className="w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Debug controls (remove in production) */}
      <div className="fixed bottom-24 left-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setIsRepLocked(!isRepLocked)}
          className="flex-1 py-2 px-4 rounded-lg backdrop-blur-md text-sm font-medium active:opacity-70"
          style={{
            backgroundColor: isRepLocked ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
            color: tokens.colors.text.primary,
          }}
        >
          {isRepLocked ? 'Rep-Locked' : 'Free Scroll'}
        </button>
        <button
          onClick={() => setIsResting(!isResting)}
          className="flex-1 py-2 px-4 rounded-lg backdrop-blur-md text-sm font-medium active:opacity-70"
          style={{
            backgroundColor: isResting ? 'rgba(245, 158, 11, 0.9)' : 'rgba(0, 0, 0, 0.6)',
            color: tokens.colors.text.primary,
          }}
        >
          {isResting ? 'Resting' : 'In Set'}
        </button>
      </div>

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
