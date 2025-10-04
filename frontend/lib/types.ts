// Type definitions for the strength training app

// ===== WORKOUT TYPES =====
export interface RepMetrics {
  tut: number; // Time under tension in ms
  speed: number; // Average velocity
  vl: number; // Velocity loss percentage
  romHit: boolean; // ROM target achieved
}

export interface RepEvent {
  id: string;
  valid: boolean;
  metrics: RepMetrics;
  ts: number;
}

export interface SetUpdate {
  repsCompleted: number;
  avgSpeed: number;
  vl: number; // Current VL percentage
  romHitRate: number; // Percentage of reps hitting ROM
  rir: number; // Reps in reserve estimate
  ts: number;
}

export interface SetSummary {
  reps: number;
  tut: number; // Total TUT
  avgSpeed: number;
  vlPercentage: number;
  romHitRate: number;
  romVariability: number; // Coefficient of variation
  tip: string; // One concise coaching tip
}

export interface SetEnd {
  summary: SetSummary;
  tip: string;
}

export type MusicMode = 'normal' | 'quiet';

export interface Exercise {
  id: string;
  name: string;
  category: string; // squat, bench, deadlift, etc.
  muscleGroups: string[];
}

export interface TargetSpec {
  type: 'rpe' | '1rm-percent';
  value: number; // RPE 1-10 or %1RM
}

export interface TempoSpec {
  eccentric: number; // seconds
  bottomPause: number;
  concentric: number | 'X'; // X = explosive
  topPause: number;
}

export interface PreSetConfig {
  exercise: Exercise;
  target: TargetSpec;
  tempo: TempoSpec;
  restTimerSeconds: number;
  repLockEnabled: boolean;
  musicMode: MusicMode;
  // Number of sets the user intends to perform for this exercise
  plannedSets: number;
  // Optional per-set details (weight). If present, length should equal plannedSets.
  sets?: Array<{
    weightKg?: number;
    completed?: boolean;
  }>;
  // Optional multi-exercise setup: each entry can carry its own planned sets/weights
  exercises?: Array<{
    exercise: Exercise;
    sets?: Array<{
      weightKg?: number;
      completed?: boolean;
    }>;
  }>;
}

export interface WorkoutSession {
  id: string;
  startTime: number;
  endTime?: number;
  programType: ProgramType;
  exercises: SessionExercise[];
  notes?: string;
}

export interface SessionExercise {
  exercise: Exercise;
  sets: CompletedSet[];
}

export interface CompletedSet {
  setNumber: number;
  summary: SetSummary;
  timestamp: number;
}

// ===== PROGRAM TYPES =====
export type ProgramType = 'strength' | 'hypertrophy' | 'technique';

export interface ProgramConfig {
  type: ProgramType;
  vlStopRange: [number, number]; // Auto-stop VL range
  focusMetrics: string[]; // Metrics to emphasize
}

export const PROGRAM_CONFIGS: Record<ProgramType, ProgramConfig> = {
  strength: {
    type: 'strength',
    vlStopRange: [10, 20],
    focusMetrics: ['vl', 'speed'],
  },
  hypertrophy: {
    type: 'hypertrophy',
    vlStopRange: [20, 30],
    focusMetrics: ['tut', 'romHitRate'],
  },
  technique: {
    type: 'technique',
    vlStopRange: [0, 10],
    focusMetrics: ['romHitRate', 'romVariability'],
  },
};

// ===== SHORTS/FEED TYPES =====
export interface ShortsQueue {
  queue: string[]; // YouTube video IDs
}

export interface PlayerState {
  videoId: string;
  state: 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';
  muted: boolean;
  currentTime: number;
}

// ===== HISTORY TYPES =====
export interface HistoryFilter {
  programType?: ProgramType;
  exerciseId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface VLDistribution {
  bins: Array<{ range: string; count: number; color: string }>;
}

export interface SpeedAtLoad {
  load: number; // kg or lbs
  avgSpeed: number;
  sessions: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

// ===== PROFILE TYPES =====
export interface Routine {
  id: string;
  name: string;
  exercises: Array<{
    exercise: Exercise;
    sets: number;
    notes?: string;
  }>;
}

export interface UserProfile {
  name: string;
  currentProgram: ProgramType;
  routines: Routine[];
  preferences: {
    largeText: boolean;
    highContrast: boolean;
    hapticsOnly: boolean;
  };
  integrations: {
    musicLinked: boolean;
    healthSharingEnabled: boolean;
  };
}

// ===== DAILY PLAN =====
export interface DailyPlan {
  date: string;
  routine: Routine;
  programType: ProgramType;
  readiness: number; // 0-100
  streak: number; // consecutive days
  qualityPRs: number; // PRs this week
  nextLifts: string[]; // Exercise names
}

// ===== SOCKET EVENT TYPES =====
export interface SocketEvents {
  rep: RepEvent;
  setUpdate: SetUpdate;
  setEnd: SetEnd;
  musicCue: { action: 'duck' | 'restore' };
  shorts: ShortsQueue;
}
