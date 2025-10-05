'use client';

import { useState, useEffect } from 'react';
import { tokens } from '@/lib/design-tokens';
import { Plus, MessageSquare, Film } from 'lucide-react';
import { PreSetSheet } from '@/components/train/pre-set-sheet';
import { InSetHUD } from '@/components/train/in-set-hud';
import { SetSummarySheet } from '@/components/train/set-summary-sheet';
import { useSocket } from '@/lib/socket-context';
import Link from 'next/link';
import type { PreSetConfig } from '@/lib/types';

type TrainState = 'idle' | 'setup' | 'in-set' | 'rest' | 'summary';

export default function TrainPage() {
  const [state, setState] = useState<TrainState>('idle');
  const [currentConfig, setCurrentConfig] = useState<PreSetConfig | null>(null);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [returnStateAfterSetup, setReturnStateAfterSetup] = useState<TrainState>('idle');
  const [plannedSets, setPlannedSets] = useState<number>(0);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(0);
  const { lastSetEnd, subscribeToSetEnd } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribeToSetEnd((end) => {
      setState('summary');
    });

    return unsubscribe;
  }, [subscribeToSetEnd]);

  // Rest timer countdown
  useEffect(() => {
    if (state === 'rest' && restTimeRemaining > 0) {
      const interval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state, restTimeRemaining]);

  const handleStartSet = (config: PreSetConfig) => {
    setCurrentConfig(config);
    setPlannedSets(Math.max(1, config.plannedSets || 1));
    setCurrentSetNumber(1);
    setState('in-set');
  };

  const handleLogAndNext = () => {
    if (currentConfig) {
      setRestTimeRemaining(currentConfig.restTimerSeconds);
      setState('rest');
    }
  };

  const handleEdit = () => {
    setReturnStateAfterSetup('rest');
    setState('setup');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    alert('Share functionality coming soon!');
  };

  const handleNextSet = () => {
    if (currentSetNumber >= plannedSets) {
      // Finished all planned sets
      setState('idle');
      return;
    }
    setCurrentSetNumber((n) => n + 1);
    setState('in-set');
  };

  return (
    <main
      className="min-h-screen relative"
      style={{ backgroundColor: tokens.colors.background.primary }}
    >
      {/* Idle State */}
      {state === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: tokens.colors.text.primary }}
            >
              Ready to Train
            </h1>
            <p style={{ color: tokens.colors.text.secondary }}>
              Set up your first exercise to get started
            </p>
          </div>

          <button
            onClick={() => setState('setup')}
            className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold active:opacity-80"
            style={{
              backgroundColor: tokens.colors.text.primary,
              color: '#000',
              minHeight: tokens.touchTarget.min,
            }}
          >
            <Plus size={24} />
            Start Exercise
          </button>
        </div>
      )}

      {/* In-Set State */}
      {state === 'in-set' && currentConfig && (
        <>
          <InSetHUD exerciseName={currentConfig.exercise.name} musicMode={currentConfig.musicMode} />

          {/* Set count badge */}
          <div className="fixed top-4 left-0 right-0 flex justify-center">
            <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: tokens.colors.background.secondary, color: tokens.colors.text.primary }}>
              Set {currentSetNumber} of {plannedSets}
            </span>
          </div>

          {/* Floating pill to end set manually */}
          <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6">
            <button
              onClick={() => setState('summary')}
              className="px-6 py-3 rounded-full font-medium text-white shadow-lg active:opacity-80"
              style={{ backgroundColor: tokens.colors.accent.error }}
            >
              End Set
            </button>
          </div>
        </>
      )}

      {/* Rest State */}
      {state === 'rest' && currentConfig && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          {/* Music Duck Indicator */}
          <div className="mb-8 px-4 py-2 rounded-full" style={{ backgroundColor: tokens.colors.background.secondary }}>
            <p className="text-sm" style={{ color: tokens.colors.text.secondary }}>
              Music auto-ducked
            </p>
          </div>

          {/* Rest Timer */}
          <div className="mb-12">
            <div
              className="text-8xl font-bold mb-2"
              style={{
                color: tokens.colors.text.primary,
                fontSize: '96px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.floor(restTimeRemaining / 60)}:{String(restTimeRemaining % 60).padStart(2, '0')}
            </div>
            <p className="text-center text-sm" style={{ color: tokens.colors.text.secondary }}>
              Rest time remaining
            </p>
          </div>

          {/* Quick Actions */}
          <div className="w-full max-w-sm space-y-3 mb-8">
            <Link href="/feed">
              <button
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium active:opacity-80"
                style={{
                  backgroundColor: tokens.colors.background.secondary,
                  color: tokens.colors.text.primary,
                }}
              >
                <Film size={20} />
                Open Feed
              </button>
            </Link>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium active:opacity-80"
              style={{
                backgroundColor: tokens.colors.background.secondary,
                color: tokens.colors.text.primary,
              }}
            >
              <MessageSquare size={20} />
              Coach Chat
            </button>
          </div>

          {/* Next Set Button */}
          <button
            onClick={handleNextSet}
            className="px-8 py-4 rounded-xl font-semibold active:opacity-80"
            style={{
              backgroundColor: tokens.colors.text.primary,
              color: '#000',
              minHeight: tokens.touchTarget.min,
            }}
          >
            {currentSetNumber >= plannedSets ? 'Finish' : 'Next Set'}
          </button>

          {/* Rest-unlocked banner */}
          {currentConfig.repLockEnabled && (
            <div className="fixed top-0 left-0 right-0 p-4 text-center" style={{ backgroundColor: tokens.colors.accent.warning }}>
              <p className="text-sm font-medium" style={{ color: tokens.colors.background.primary }}>
                Rest-unlocked • Free scrolling enabled
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {state === 'setup' && (
        <PreSetSheet
          onStart={handleStartSet}
          onClose={() => setState(returnStateAfterSetup)}
        />
      )}

      {state === 'summary' && lastSetEnd && (
        <SetSummarySheet
          summary={lastSetEnd.summary}
          onLog={handleLogAndNext}
          onEdit={handleEdit}
          onShare={handleShare}
          onClose={() => setState('rest')}
        />
      )}
    </main>
  );
}
