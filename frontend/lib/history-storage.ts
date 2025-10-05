"use client";

import type { Workout, Exercise as HevyExercise, Set as HevySet } from "./hevy-types";

const KEY = "workoutHistory";

export function loadHistory(): Workout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<Workout, "date"> & { date: string | Date }>;
    // Ensure date is a Date instance
    return parsed.map((w) => ({
      ...w,
      date: new Date(w.date),
    })) as Workout[];
  } catch {
    return [];
  }
}

export function saveHistory(workouts: Workout[]) {
  if (typeof window === "undefined") return;
  try {
    const serializable = workouts.map((w) => ({ ...w, date: w.date.toISOString() }));
    localStorage.setItem(KEY, JSON.stringify(serializable));
  } catch {
    // ignore
  }
}

export function addWorkout(entry: Workout) {
  const list = loadHistory();
  list.unshift(entry); // newest first
  saveHistory(list);
}
