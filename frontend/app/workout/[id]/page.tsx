"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExerciseItem } from "@/components/ExerciseItem";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { getAllWorkouts, calculateWorkoutVolume } from "@/lib/mock-data";
import { Set, Workout } from "@/lib/hevy-types";

/**
 * Workout Detail View
 * Hevy UX pattern: Expandable exercise list with inline set editing
 * Rest timer between sets, progress tracking, and finish workout summary
 */
export default function WorkoutDetail() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const allWorkouts = getAllWorkouts();
    const foundWorkout = allWorkouts.find(w => w.id === workoutId);
    if (foundWorkout) {
      setWorkout(foundWorkout);
    }
  }, [workoutId]);

  useEffect(() => {
    if (isRestTimerActive && restTimer > 0) {
      const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (restTimer === 0) {
      setIsRestTimerActive(false);
    }
  }, [isRestTimerActive, restTimer]);

  const handleSetUpdate = (exerciseId: string, setId: string, updates: Partial<Set>) => {
    if (!workout) return;

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            }
          : ex
      ),
    };

    setWorkout(updatedWorkout);

    // Start rest timer when a set is completed
    if (updates.completed && updates.completed === true) {
      const set = workout.exercises
        .find(ex => ex.id === exerciseId)
        ?.sets.find(s => s.id === setId);
      if (set?.restTime) {
        setRestTimer(set.restTime);
        setIsRestTimerActive(true);
      }
    }
  };

  const handleFinishWorkout = () => {
    if (!workout) return;
    const volume = calculateWorkoutVolume(workout);
    setWorkout({ ...workout, totalVolume: volume, completed: true });
    setShowSummary(true);
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-500">Loading workout...</p>
      </div>
    );
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  );
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{workout.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span>{completedSets}/{totalSets} sets</span>
              <span>•</span>
              <span>{workout.duration || 0} min</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="mt-3" />
      </header>

      {/* Rest Timer */}
      {isRestTimerActive && restTimer > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Rest Timer</span>
          </div>
          <div className="text-2xl font-bold">{restTimer}s</div>
        </div>
      )}

      {/* Exercises */}
      <main className="px-6 py-6 space-y-2">
        {workout.exercises.map((exercise) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            onSetUpdate={(setId, updates) =>
              handleSetUpdate(exercise.id, setId, updates)
            }
          />
        ))}
      </main>

      {/* Finish Workout Button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          onClick={handleFinishWorkout}
        >
          Finish Workout
        </Button>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout Complete! 🎉</DialogTitle>
            <DialogDescription>Great job finishing your workout</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Clock className="h-5 w-5" />
                <span>Duration</span>
              </div>
              <span className="font-semibold">{workout.duration} min</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <TrendingUp className="h-5 w-5" />
                <span>Total Volume</span>
              </div>
              <span className="font-semibold">{workout.totalVolume?.toLocaleString()} kg</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <span className="text-neutral-600 dark:text-neutral-400">Sets Completed</span>
              <span className="font-semibold">{completedSets}/{totalSets}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setShowSummary(false);
                router.push('/');
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Navbar />
    </div>
  );
}
