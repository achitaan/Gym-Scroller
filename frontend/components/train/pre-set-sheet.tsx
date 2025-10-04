'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { X, ChevronDown } from 'lucide-react';
import type { PreSetConfig, Exercise, TargetSpec, TempoSpec, MusicMode } from '@/lib/types';

interface PreSetSheetProps {
  onStart: (config: PreSetConfig) => void;
  onClose: () => void;
}

const mockExercises: Exercise[] = [
  { id: '1', name: 'Back Squat', category: 'squat', muscleGroups: ['quads', 'glutes'] },
  { id: '2', name: 'Bench Press', category: 'bench', muscleGroups: ['chest', 'triceps'] },
  { id: '3', name: 'Deadlift', category: 'deadlift', muscleGroups: ['back', 'hamstrings'] },
];

export function PreSetSheet({ onStart, onClose }: PreSetSheetProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(mockExercises[0]);
  const [targetType, setTargetType] = useState<'rpe' | '1rm-percent'>('rpe');
  const [targetValue, setTargetValue] = useState(8);
  const [tempo, setTempo] = useState<TempoSpec>({ eccentric: 3, bottomPause: 1, concentric: 'X', topPause: 1 });
  const [restTimer, setRestTimer] = useState(180);
  const [repLock, setRepLock] = useState(true);
  const [musicMode, setMusicMode] = useState<MusicMode>('normal');

  const handleStart = () => {
    const config: PreSetConfig = {
      exercise: selectedExercise,
      target: { type: targetType, value: targetValue },
      tempo,
      restTimerSeconds: restTimer,
      repLockEnabled: repLock,
      musicMode,
    };
    onStart(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl p-6"
        style={{
          backgroundColor: tokens.colors.background.secondary,
          borderTopLeftRadius: tokens.radius.xl,
          borderTopRightRadius: tokens.radius.xl,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: tokens.colors.border.default }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
            style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.heading.size }}
          >
            Set Up
          </h2>
          <button onClick={onClose} className="p-2 rounded-full active:opacity-70">
            <X size={24} style={{ color: tokens.colors.text.secondary }} />
          </button>
        </div>

        {/* Exercise Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Exercise
          </label>
          <div className="relative">
            <select
              value={selectedExercise.id}
              onChange={(e) => setSelectedExercise(mockExercises.find(ex => ex.id === e.target.value)!)}
              className="w-full p-4 rounded-lg appearance-none pr-10"
              style={{
                backgroundColor: tokens.colors.background.tertiary,
                color: tokens.colors.text.primary,
                borderRadius: tokens.radius.md,
              }}
            >
              {mockExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" size={20} style={{ color: tokens.colors.text.secondary }} />
          </div>
        </div>

        {/* Target */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Target
          </label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setTargetType('rpe')}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: targetType === 'rpe' ? tokens.colors.accent.primary : tokens.colors.background.tertiary,
                color: targetType === 'rpe' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              }}
            >
              RPE
            </button>
            <button
              onClick={() => setTargetType('1rm-percent')}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: targetType === '1rm-percent' ? tokens.colors.accent.primary : tokens.colors.background.tertiary,
                color: targetType === '1rm-percent' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              }}
            >
              %1RM
            </button>
          </div>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            min={targetType === 'rpe' ? 1 : 0}
            max={targetType === 'rpe' ? 10 : 100}
            className="w-full p-4 rounded-lg"
            style={{
              backgroundColor: tokens.colors.background.tertiary,
              color: tokens.colors.text.primary,
            }}
          />
        </div>

        {/* Tempo */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Tempo (3-1-X-1)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['eccentric', 'bottomPause', 'concentric', 'topPause'].map((phase, idx) => (
              <div key={phase}>
                <input
                  type="text"
                  value={tempo[phase as keyof TempoSpec]}
                  onChange={(e) => setTempo({ ...tempo, [phase]: e.target.value === 'X' ? 'X' : Number(e.target.value) })}
                  className="w-full p-3 text-center rounded-lg"
                  style={{
                    backgroundColor: tokens.colors.background.tertiary,
                    color: tokens.colors.text.primary,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rest Timer */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Rest Timer (seconds)
          </label>
          <input
            type="number"
            value={restTimer}
            onChange={(e) => setRestTimer(Number(e.target.value))}
            className="w-full p-4 rounded-lg"
            style={{
              backgroundColor: tokens.colors.background.tertiary,
              color: tokens.colors.text.primary,
            }}
          />
        </div>

        {/* Rep-Lock Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: tokens.colors.background.tertiary }}>
          <span style={{ color: tokens.colors.text.primary }}>Rep-locked scrolling</span>
          <button
            onClick={() => setRepLock(!repLock)}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{ backgroundColor: repLock ? tokens.colors.accent.primary : tokens.colors.border.default }}
          >
            <div
              className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
              style={{ transform: repLock ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Music Mode */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Music Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMusicMode('normal')}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: musicMode === 'normal' ? tokens.colors.accent.primary : tokens.colors.background.tertiary,
                color: musicMode === 'normal' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              }}
            >
              Normal
            </button>
            <button
              onClick={() => setMusicMode('quiet')}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: musicMode === 'quiet' ? tokens.colors.accent.primary : tokens.colors.background.tertiary,
                color: musicMode === 'quiet' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              }}
            >
              Quiet Coaching
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-semibold text-white active:opacity-80"
          style={{
            backgroundColor: tokens.colors.accent.primary,
            minHeight: tokens.touchTarget.min,
          }}
        >
          Start Set
        </button>
      </div>
    </div>
  );
}
