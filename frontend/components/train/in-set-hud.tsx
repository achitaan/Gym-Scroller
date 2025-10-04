'use client';

import { useEffect, useState } from 'react';
import { tokens, getVLColor } from '@/lib/design-tokens';
import { useSocket } from '@/lib/socket-context';
import { CheckCircle2, Circle, Music } from 'lucide-react';

interface InSetHUDProps {
  exerciseName: string;
  musicMode: 'normal' | 'quiet';
}

export function InSetHUD({ exerciseName, musicMode }: InSetHUDProps) {
  const { currentSet, subscribeToReps } = useSocket();
  const [repCount, setRepCount] = useState(0);
  const [tut, setTut] = useState(0);
  const [romHits, setRomHits] = useState(0);
  const [totalReps, setTotalReps] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToReps((rep) => {
      if (rep.valid) {
        setRepCount((prev) => prev + 1);
        setTotalReps((prev) => prev + 1);
        if (rep.metrics.romHit) {
          setRomHits((prev) => prev + 1);
        }
      }
    });

    return unsubscribe;
  }, [subscribeToReps]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTut((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const vlColor = currentSet ? getVLColor(currentSet.vl) : tokens.colors.vl.minimal;
  const romHitRate = totalReps > 0 ? (romHits / totalReps) * 100 : 100;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 p-6 pb-8"
      style={{
        background: `linear-gradient(to bottom, ${tokens.colors.background.primary} 0%, ${tokens.colors.background.primary} 60%, transparent 100%)`,
      }}
    >
      {/* Exercise Name */}
      <div className="text-center mb-6">
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: tokens.colors.text.secondary, fontSize: tokens.typography.caption.size }}
        >
          {exerciseName}
        </h2>
      </div>

      {/* Rep Counter */}
      <div className="text-center mb-6">
        <div
          className="text-8xl font-bold"
          style={{
            color: tokens.colors.text.primary,
            fontSize: '96px',
            lineHeight: '1',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {repCount}
        </div>
        <p className="text-sm mt-2" style={{ color: tokens.colors.text.secondary }}>
          reps
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* ROM Hit Icon */}
        <div className="flex flex-col items-center">
          {currentSet && currentSet.repsCompleted > 0 && (
            romHitRate >= 80 ? (
              <CheckCircle2 size={24} style={{ color: tokens.colors.accent.success }} />
            ) : (
              <Circle size={24} style={{ color: tokens.colors.text.tertiary }} />
            )
          )}
          <span className="text-xs mt-1" style={{ color: tokens.colors.text.tertiary }}>
            ROM
          </span>
        </div>

        {/* TUT */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold" style={{ color: tokens.colors.text.primary }}>
            {(tut / 1000).toFixed(1)}s
          </span>
          <span className="text-xs" style={{ color: tokens.colors.text.tertiary }}>
            TUT
          </span>
        </div>

        {/* RIR */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold" style={{ color: tokens.colors.text.primary }}>
            {currentSet?.rir ?? '—'}
          </span>
          <span className="text-xs" style={{ color: tokens.colors.text.tertiary }}>
            RIR
          </span>
        </div>

        {/* Music Indicator */}
        <div className="flex flex-col items-center">
          <Music
            size={20}
            style={{ color: musicMode === 'quiet' ? tokens.colors.text.tertiary : tokens.colors.accent.primary }}
          />
          <span className="text-xs" style={{ color: tokens.colors.text.tertiary }}>
            {musicMode === 'quiet' ? 'Quiet' : 'Normal'}
          </span>
        </div>
      </div>

      {/* VL Color Band */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: tokens.colors.background.tertiary }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: currentSet ? `${Math.min(currentSet.vl, 100)}%` : '0%',
            backgroundColor: vlColor,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs" style={{ color: tokens.colors.text.tertiary }}>
        <span>VL: {currentSet?.vl.toFixed(1) ?? '0.0'}%</span>
        <span>{currentSet?.avgSpeed.toFixed(2) ?? '0.00'} m/s</span>
      </div>
    </div>
  );
}
