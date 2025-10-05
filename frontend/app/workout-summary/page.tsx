'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { ArrowLeft, CheckCircle, Clock, Dumbbell } from 'lucide-react';

export default function WorkoutSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workoutData, setWorkoutData] = useState<null | { 
    exercises: Array<{ exercise: any; sets?: Array<{ weightKg?: number }> }>;
    totalReps: number;
    duration?: number;
  }>(null);

  // Decode workout data from query param
  useEffect(() => {
    try {
      const b64 = searchParams.get('data');
      if (!b64) return;
      const json = decodeURIComponent(escape(window.atob(b64)));
      const parsed = JSON.parse(json);
      if (parsed) {
        setWorkoutData(parsed);
      }
    } catch (e) {
      console.warn('Failed to decode workout data', e);
    }
  }, [searchParams]);

  const totalSets = workoutData?.exercises.reduce((total, ex) => total + (ex.sets?.length ?? 0), 0) ?? 0;
  const totalWeight = workoutData?.exercises.reduce((total, ex) => {
    return total + (ex.sets?.reduce((setTotal, set) => setTotal + (set.weightKg ?? 0), 0) ?? 0);
  }, 0) ?? 0;

  return (
    <main
      className="min-h-screen relative"
      style={{ backgroundColor: tokens.colors.background.primary }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/today')}
            className="p-2 rounded-full active:opacity-70"
            style={{ backgroundColor: tokens.colors.background.secondary }}
          >
            <ArrowLeft size={24} style={{ color: tokens.colors.text.primary }} />
          </button>
          <h1
            className="text-2xl font-bold"
            style={{ color: tokens.colors.text.primary }}
          >
            Workout Complete!
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="p-4 rounded-full bg-white"
          >
            <CheckCircle size={48} color="black" />
          </div>
        </div>

        {workoutData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: tokens.colors.background.secondary }}
              >
                <div className="flex justify-center mb-2">
                  <Dumbbell size={24} style={{ color: tokens.colors.text.primary }} />
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: tokens.colors.text.primary }}
                >
                  {workoutData.totalReps}
                </div>
                <div
                  className="text-sm"
                  style={{ color: tokens.colors.text.secondary }}
                >
                  Total Reps
                </div>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: tokens.colors.background.secondary }}
              >
                <div className="flex justify-center mb-2">
                  <Clock size={24} style={{ color: tokens.colors.text.primary }} />
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: tokens.colors.text.primary }}
                >
                  {totalSets}
                </div>
                <div
                  className="text-sm"
                  style={{ color: tokens.colors.text.secondary }}
                >
                  Total Sets
                </div>
              </div>
            </div>

            {/* Exercise Summary */}
            <div className="mb-8">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: tokens.colors.text.primary }}
              >
                Exercises Completed
              </h2>
              <div className="space-y-3">
                {workoutData.exercises.map((ex: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: tokens.colors.background.secondary }}
                  >
                    <div className="mb-3">
                      <div
                        className="font-medium"
                        style={{ color: tokens.colors.text.primary }}
                      >
                        {ex.exercise.name}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: tokens.colors.text.secondary }}
                      >
                        {ex.sets?.length ?? 0} sets completed
                      </div>
                    </div>
                    
                    {/* Set Details */}
                    {ex.sets && ex.sets.length > 0 && (
                      <div className="space-y-2">
                        {ex.sets.map((set: any, setIndex: number) => (
                          <div
                            key={setIndex}
                            className="flex items-center justify-between p-2 rounded"
                            style={{ backgroundColor: tokens.colors.background.tertiary }}
                          >
                            <div
                              className="text-sm"
                              style={{ color: tokens.colors.text.secondary }}
                            >
                              Set {setIndex + 1}
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className="text-sm font-medium"
                                style={{ color: tokens.colors.text.primary }}
                              >
                                {set.repsCompleted ?? 0} reps
                              </div>
                              <div
                                className="text-sm"
                                style={{ color: tokens.colors.text.primary }}
                              >
                                {set.weightKg ? `${set.weightKg}kg` : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div
              className="text-lg"
              style={{ color: tokens.colors.text.secondary }}
            >
              Great job on your workout!
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/today')}
            className="w-full py-4 rounded-xl font-semibold active:opacity-80"
            style={{
              backgroundColor: tokens.colors.text.primary,
              color: '#000',
              minHeight: tokens.touchTarget.min,
            }}
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push('/train')}
            className="w-full py-4 rounded-xl font-semibold active:opacity-80"
            style={{
              backgroundColor: tokens.colors.background.secondary,
              color: tokens.colors.text.primary,
              minHeight: tokens.touchTarget.min,
            }}
          >
            Start New Workout
          </button>
        </div>
      </div>
    </main>
  );
}