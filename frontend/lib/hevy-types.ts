// Type definitions for Hevy-inspired fitness tracking app

export interface Set {
  id: string;
  reps: number;
  weight: number; // in kg or lbs
  completed: boolean;
  restTime?: number; // seconds
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string; // 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
  sets: Set[];
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: Exercise[];
  duration?: number; // in minutes
  totalVolume?: number; // total weight lifted (reps × weight)
  notes?: string;
  completed: boolean;
}

export interface UserStats {
  name: string;
  avatarUrl?: string;
  streak: number; // consecutive workout days
  totalWorkouts: number;
  totalVolume: number; // lifetime total weight lifted
  currentWeight?: number; // user's body weight
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: {
    name: string;
    category: string;
    targetSets: number;
    targetReps: number;
    notes?: string;
  }[];
}
