'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { X, ChevronDown } from 'lucide-react';
import type { PreSetConfig, Exercise, TargetSpec, TempoSpec, MusicMode } from '@/lib/types';
import { EXERCISES } from '@/lib/exercise-catalog';

interface PreSetSheetProps {
  onStart: (config: PreSetConfig) => void;
  onClose: () => void;
}

const mockExercises: Exercise[] = EXERCISES;

export function PreSetSheet({ onStart, onClose }: PreSetSheetProps) {
  const router = useRouter();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(mockExercises[0]);
  const [targetType, setTargetType] = useState<'rpe' | '1rm-percent'>('rpe');
  const [targetValue, setTargetValue] = useState(8);
  const [tempo, setTempo] = useState<TempoSpec>({ eccentric: 3, bottomPause: 1, concentric: 'X', topPause: 1 });
  const [restTimer, setRestTimer] = useState(180);
  const [repLock, setRepLock] = useState(true);
  const [musicMode, setMusicMode] = useState<MusicMode>('normal');
  const [plannedSets, setPlannedSets] = useState<number>(3);
  const [sets, setSets] = useState<Array<{ weightKg?: number }>>(() =>
    new Array(3).fill(0).map(() => ({ weightKg: undefined }))
  );
  const [exercisesState, setExercisesState] = useState<Array<{ exercise: Exercise; sets: Array<{ weightKg?: number }> }>>(() => [
    { exercise: mockExercises[0], sets: new Array(3).fill(0).map(() => ({ weightKg: undefined })) },
  ]);

  const handleStart = () => {
    const config: PreSetConfig = {
      // keep backward-compatible top-level exercise as the first one
      exercise: exercisesState[0]?.exercise ?? selectedExercise,
      target: { type: targetType, value: targetValue },
      tempo,
      restTimerSeconds: restTimer,
      repLockEnabled: repLock,
      musicMode,
      plannedSets,
      sets,
      exercises: exercisesState,
    };
    onStart(config);
    // navigate to feed with preset encoded in the URL
    try {
      const payload = JSON.stringify({ exercises: exercisesState });
      // UTF-8 safe base64
      const b64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(payload))) : '';
      router.push(`/feed?preset=${encodeURIComponent(b64)}`);
    } catch (e) {
      // fallback: just navigate without payload
      router.push('/feed');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Full screen sheet */}
      <div
        className="relative w-full h-full overflow-y-auto scroll-smooth"
        style={{
          backgroundColor: tokens.colors.background.secondary,
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          paddingBottom: '100px', // Extra space for bottom nav
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="p-6 pt-4">
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

        {/* Exercises (multiple) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: tokens.colors.text.secondary }}>
            Exercises
          </label>
          <div className="space-y-4">
            {exercisesState.map((exEntry, exIdx) => (
              <div key={exIdx} className="p-3 rounded-lg" style={{ backgroundColor: tokens.colors.background.tertiary }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <select
                      value={exEntry.exercise.id}
                      onChange={(e) => {
                        const found = mockExercises.find((me) => me.id === e.target.value)!;
                        setExercisesState((prev) => {
                          const copy = prev.slice();
                          copy[exIdx] = { ...copy[exIdx], exercise: found };
                          return copy;
                        });
                      }}
                      className="w-full p-3 rounded-lg appearance-none"
                      style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.primary }}
                    >
                      {mockExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExercisesState((prev) => prev.filter((_, i) => i !== exIdx))}
                    className="ml-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: tokens.colors.background.secondary, color: tokens.colors.text.secondary }}
                  >
                    Remove
                  </button>
                </div>

                {/* sets for this exercise */}
                <div className="space-y-2">
                  {exEntry.sets && exEntry.sets.length > 0 ? (
                    <>
                      {exEntry.sets.map((s, si) => (
                        <div key={si} className="flex items-center gap-3">
                          <div className="w-12 text-sm text-slate-500" style={{ color: tokens.colors.text.secondary }}>#{si + 1}</div>
                          <input
                            type="number"
                            placeholder="kg"
                            value={s.weightKg ?? ''}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value || '');
                              setExercisesState((prev) => {
                                const copy = prev.slice();
                                const entry = { ...copy[exIdx] };
                                const setsCopy = entry.sets.slice();
                                setsCopy[si] = { ...setsCopy[si], weightKg: Number.isNaN(v) ? undefined : v };
                                entry.sets = setsCopy;
                                copy[exIdx] = entry;
                                return copy;
                              });
                            }}
                            className="flex-1 p-3 rounded-lg text-right"
                            style={{ backgroundColor: tokens.colors.background.secondary, color: tokens.colors.text.primary }}
                          />
                          <button
                            type="button"
                            onClick={() => setExercisesState((prev) => {
                              const copy = prev.slice();
                              copy[exIdx] = { ...copy[exIdx], sets: copy[exIdx].sets.filter((_, i) => i !== si) };
                              return copy;
                            })}
                            className="px-3 py-2 rounded-lg"
                            style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.secondary }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setExercisesState((prev) => {
                            const copy = prev.slice();
                            copy[exIdx] = { ...copy[exIdx], sets: [...copy[exIdx].sets, { weightKg: undefined }] };
                            return copy;
                          })}
                          className="px-3 py-2 rounded-lg"
                          style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.primary }}
                        >
                          + Add Set
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500" style={{ color: tokens.colors.text.secondary }}>No sets yet</div>
                      <button
                        type="button"
                        onClick={() => setExercisesState((prev) => {
                          const copy = prev.slice();
                          copy[exIdx] = { ...copy[exIdx], sets: [{ weightKg: undefined }] };
                          return copy;
                        })}
                        className="px-3 py-2 rounded-lg"
                        style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.primary }}
                      >
                        + Add Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div>
              <div className="flex gap-3">
                <select
                  value={selectedExercise.id}
                  onChange={(e) => setSelectedExercise(mockExercises.find(ex => ex.id === e.target.value)!)}
                  className="flex-1 p-3 rounded-lg appearance-none"
                  style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.primary }}
                >
                  {mockExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setExercisesState((prev) => [...prev, { exercise: selectedExercise, sets: new Array(3).fill(0).map(() => ({ weightKg: undefined })) }])}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: tokens.colors.background.tertiary, color: tokens.colors.text.primary }}
                >
                  + Add Exercise
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* (Global sets editor removed — sets are per-exercise now) */}

        {/* Target removed per request */}

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-semibold text-white active:opacity-80"
          style={{
            backgroundColor: tokens.colors.accent.primary,
            minHeight: tokens.touchTarget.min,
          }}
        >
          Start Workout
        </button>
        </div>
      </div>
    </div>
  );
}
