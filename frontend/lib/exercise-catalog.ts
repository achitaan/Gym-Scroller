import type { Exercise } from '@/lib/types';

// Central exercise catalog used by setup and recommendations
export const EXERCISES: Exercise[] = [
  // The Big 3 + OHP (Core Compound Movements)
  { id: '1', name: 'Back Squat', category: 'squat', muscleGroups: ['quads', 'glutes'] },
  { id: '2', name: 'Bench Press', category: 'bench', muscleGroups: ['chest', 'triceps'] },
  { id: '3', name: 'Deadlift', category: 'deadlift', muscleGroups: ['back', 'hamstrings'] },
  { id: '4', name: 'Overhead Press', category: 'press', muscleGroups: ['shoulders', 'triceps'] },

  // Essential Variations
  { id: '5', name: 'Romanian Deadlift', category: 'deadlift', muscleGroups: ['hamstrings', 'glutes'] },
  { id: '6', name: 'Incline Bench Press', category: 'bench', muscleGroups: ['chest', 'triceps'] },
  { id: '7', name: 'Front Squat', category: 'squat', muscleGroups: ['quads', 'core'] },

  // Popular Upper Body
  { id: '8', name: 'Pull-ups', category: 'bodyweight', muscleGroups: ['back', 'biceps'] },
  { id: '9', name: 'Dips', category: 'bodyweight', muscleGroups: ['chest', 'triceps'] },
  { id: '10', name: 'Barbell Row', category: 'accessory', muscleGroups: ['back', 'biceps'] },
  { id: '11', name: 'Lat Pulldown', category: 'accessory', muscleGroups: ['back', 'biceps'] },

  // Essential Accessories
  { id: '12', name: 'Bulgarian Split Squat', category: 'accessory', muscleGroups: ['quads', 'glutes'] },
  { id: '13', name: 'Hip Thrusts', category: 'accessory', muscleGroups: ['glutes'] },
  { id: '14', name: 'Lateral Raises', category: 'accessory', muscleGroups: ['shoulders'] },
  { id: '15', name: 'Barbell Curls', category: 'accessory', muscleGroups: ['biceps'] },

  // Functional Movements
  { id: '16', name: 'Push-ups', category: 'bodyweight', muscleGroups: ['chest', 'triceps'] },
  { id: '17', name: 'Plank', category: 'core', muscleGroups: ['core'] },
  { id: '18', name: 'Lunges', category: 'accessory', muscleGroups: ['quads', 'glutes'] },

  // Popular Machines/Isolation
  { id: '19', name: 'Leg Press', category: 'accessory', muscleGroups: ['quads', 'glutes'] },
  { id: '20', name: 'Calf Raises', category: 'accessory', muscleGroups: ['calves'] },
];

export const findExerciseByName = (name: string): Exercise | undefined =>
  EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase());
