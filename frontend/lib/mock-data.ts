import { Workout, Exercise, Set, UserStats, VolumeDataPoint, WorkoutTemplate } from './hevy-types';

// Mock user stats
export const mockUserStats: UserStats = {
  name: "Alex Johnson",
  avatarUrl: undefined,
  streak: 12,
  totalWorkouts: 87,
  totalVolume: 425000, // in kg
  currentWeight: 75,
};

// Mock workout templates
export const mockTemplates: WorkoutTemplate[] = [
  {
    id: 'template-1',
    name: 'Push Day',
    exercises: [
      { name: 'Bench Press', category: 'chest', targetSets: 4, targetReps: 8 },
      { name: 'Overhead Press', category: 'shoulders', targetSets: 3, targetReps: 10 },
      { name: 'Incline Dumbbell Press', category: 'chest', targetSets: 3, targetReps: 12 },
      { name: 'Lateral Raises', category: 'shoulders', targetSets: 3, targetReps: 15 },
      { name: 'Tricep Pushdown', category: 'arms', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: 'template-2',
    name: 'Pull Day',
    exercises: [
      { name: 'Deadlift', category: 'back', targetSets: 4, targetReps: 6 },
      { name: 'Pull-ups', category: 'back', targetSets: 3, targetReps: 10 },
      { name: 'Barbell Row', category: 'back', targetSets: 4, targetReps: 8 },
      { name: 'Face Pulls', category: 'shoulders', targetSets: 3, targetReps: 15 },
      { name: 'Bicep Curls', category: 'arms', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: 'template-3',
    name: 'Leg Day',
    exercises: [
      { name: 'Squat', category: 'legs', targetSets: 4, targetReps: 8 },
      { name: 'Romanian Deadlift', category: 'legs', targetSets: 3, targetReps: 10 },
      { name: 'Leg Press', category: 'legs', targetSets: 3, targetReps: 12 },
      { name: 'Leg Curl', category: 'legs', targetSets: 3, targetReps: 12 },
      { name: 'Calf Raises', category: 'legs', targetSets: 4, targetReps: 15 },
    ],
  },
];

// Create sets helper
const createSets = (count: number, reps: number, weight: number, completed: boolean = true): Set[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `set-${Date.now()}-${i}`,
    reps,
    weight,
    completed,
    restTime: 90,
  }));
};

// Today's workout (in progress)
export const todaysWorkout: Workout = {
  id: 'workout-today',
  name: 'Push Day',
  date: new Date(),
  completed: false,
  exercises: [
    {
      id: 'ex-1',
      name: 'Bench Press',
      category: 'chest',
      sets: [
        ...createSets(3, 8, 80, true),
        { id: 'set-current', reps: 0, weight: 80, completed: false, restTime: 90 },
      ],
    },
    {
      id: 'ex-2',
      name: 'Overhead Press',
      category: 'shoulders',
      sets: createSets(3, 10, 50, false),
    },
    {
      id: 'ex-3',
      name: 'Incline Dumbbell Press',
      category: 'chest',
      sets: createSets(3, 12, 30, false),
    },
  ],
  duration: 45,
};

// Previous workouts for history
export const previousWorkouts: Workout[] = [
  {
    id: 'workout-1',
    name: 'Pull Day',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    completed: true,
    exercises: [
      {
        id: 'ex-4',
        name: 'Deadlift',
        category: 'back',
        sets: createSets(4, 6, 140),
      },
      {
        id: 'ex-5',
        name: 'Pull-ups',
        category: 'back',
        sets: createSets(3, 10, 0), // bodyweight
      },
      {
        id: 'ex-6',
        name: 'Barbell Row',
        category: 'back',
        sets: createSets(4, 8, 80),
      },
    ],
    duration: 52,
    totalVolume: 4560,
  },
  {
    id: 'workout-2',
    name: 'Leg Day',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    completed: true,
    exercises: [
      {
        id: 'ex-7',
        name: 'Squat',
        category: 'legs',
        sets: createSets(4, 8, 120),
      },
      {
        id: 'ex-8',
        name: 'Romanian Deadlift',
        category: 'legs',
        sets: createSets(3, 10, 100),
      },
      {
        id: 'ex-9',
        name: 'Leg Press',
        category: 'legs',
        sets: createSets(3, 12, 200),
      },
    ],
    duration: 58,
    totalVolume: 13440,
  },
  {
    id: 'workout-3',
    name: 'Push Day',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    completed: true,
    exercises: [
      {
        id: 'ex-10',
        name: 'Bench Press',
        category: 'chest',
        sets: createSets(4, 8, 80),
      },
      {
        id: 'ex-11',
        name: 'Overhead Press',
        category: 'shoulders',
        sets: createSets(3, 10, 50),
      },
      {
        id: 'ex-12',
        name: 'Incline Dumbbell Press',
        category: 'chest',
        sets: createSets(3, 12, 30),
      },
    ],
    duration: 48,
    totalVolume: 5060,
  },
];

// Volume data for charts (last 30 days)
export const volumeData: VolumeDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    volume: Math.floor(Math.random() * 8000) + 2000, // Random volume between 2000-10000
  };
});

// Calculate total volume for a workout
export const calculateWorkoutVolume = (workout: Workout): number => {
  return workout.exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.completed ? set.reps * set.weight : 0);
    }, 0);
    return total + exerciseVolume;
  }, 0);
};

// Get all workouts
export const getAllWorkouts = (): Workout[] => {
  return [todaysWorkout, ...previousWorkouts];
};
