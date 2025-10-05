import { EXERCISES } from './exercise-catalog';

interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  category: string;
  description?: string;
}

interface FormVideoRequest {
  exercise: Exercise;
  variation?: 'standard' | 'slow-motion' | 'multi-angle' | 'beginner-focus';
  duration?: number;
  includeCommonMistakes?: boolean;
  includeCues?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface FormVideo {
  id: string;
  exerciseId: string;
  exerciseName: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  variation: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

class ExerciseFormVideoService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api/form-videos') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate AI form video for a specific exercise
   */
  async generateVideo(request: FormVideoRequest): Promise<FormVideo> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate video: ${response.statusText}`);
    }

    const data = await response.json();
    return data.video;
  }

  /**
   * Get existing form video for an exercise
   */
  async getVideo(
    exerciseId: string, 
    options?: { 
      variation?: string; 
      difficulty?: 'beginner' | 'intermediate' | 'advanced' 
    }
  ): Promise<FormVideo | null> {
    const params = new URLSearchParams({
      exerciseId,
      ...(options?.variation && { variation: options.variation }),
      ...(options?.difficulty && { difficulty: options.difficulty }),
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get video: ${response.statusText}`);
    }

    const data = await response.json();
    return data.video;
  }

  /**
   * Generate form video based on exercise from catalog
   */
  async generateForExercise(exerciseId: string, options: {
    variation?: 'standard' | 'slow-motion' | 'multi-angle' | 'beginner-focus';
    includeCommonMistakes?: boolean;
    includeCues?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
  } = {}): Promise<FormVideo> {
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    
    if (!exercise) {
      throw new Error(`Exercise with ID ${exerciseId} not found`);
    }

    return this.generateVideo({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        muscleGroups: exercise.muscleGroups,
        equipment: 'barbell', // Default equipment
        category: exercise.category,
      },
      variation: options.variation,
      duration: options.duration,
      includeCommonMistakes: options.includeCommonMistakes ?? true,
      includeCues: options.includeCues ?? true,
      difficulty: options.difficulty ?? 'intermediate',
    });
  }

  /**
   * Get exercise-specific video prompt
   */
  getExercisePrompt(exerciseName: string, options: {
    includeCommonMistakes?: boolean;
    includeCues?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  } = {}): string {
    const { includeCommonMistakes = true, includeCues = true, difficulty = 'intermediate' } = options;
    
    let prompt = `Create a detailed form instruction video for ${exerciseName}. `;
    
    // Add difficulty-specific instructions
    switch (difficulty) {
      case 'beginner':
        prompt += 'Focus on basic setup, positioning, and fundamental movement patterns. Use slower movements and emphasize safety. ';
        break;
      case 'intermediate':
        prompt += 'Include proper setup, full range of motion, and technique refinements. Show normal training pace. ';
        break;
      case 'advanced':
        prompt += 'Demonstrate advanced techniques, variations, and performance optimization cues. Show competition-level execution. ';
        break;
    }

    // Add exercise-specific details based on exercise name
    const exerciseSpecifics = this.getExerciseSpecifics(exerciseName);
    if (exerciseSpecifics) {
      prompt += exerciseSpecifics + ' ';
    }

    if (includeCues) {
      prompt += 'Include key coaching cues and breathing patterns. ';
    }

    if (includeCommonMistakes) {
      prompt += 'Highlight common mistakes and how to avoid them. ';
    }

    prompt += 'Use professional gym lighting and multiple camera angles. Show the exercise from front, side, and 45-degree angles for complete form analysis.';

    return prompt;
  }

  /**
   * Get exercise-specific prompting details
   */
  private getExerciseSpecifics(exerciseName: string): string {
    const specifics: Record<string, string> = {
      'Back Squat': 'Show proper bar position on traps, foot placement, knee tracking, and depth markers. Emphasize neutral spine and core bracing.',
      'Bench Press': 'Demonstrate proper bar path, shoulder blade retraction, leg drive, and grip width. Show setup from unracking to completion.',
      'Deadlift': 'Focus on hip hinge pattern, bar path close to body, neutral spine, and proper lockout. Show both setup and execution phases.',
      'Overhead Press': 'Highlight core stability, vertical bar path, and full shoulder mobility. Demonstrate proper starting position and lockout.',
      'Romanian Deadlift': 'Emphasize hip hinge movement, hamstring stretch, and maintaining neutral spine. Show the difference from conventional deadlift.',
      'Pull-ups': 'Show proper grip, shoulder engagement, and full range of motion from dead hang to chin over bar.',
      'Push-ups': 'Demonstrate proper plank position, hand placement, and full range of motion with body alignment.',
      'Barbell Row': 'Focus on bent-over position, bar path to lower chest/upper abdomen, and maintaining neutral spine.',
      'Front Squat': 'Show proper front rack position, upright torso maintenance, and elbow positioning throughout the movement.',
      'Incline Bench Press': 'Demonstrate optimal bench angle, bar path differences from flat bench, and shoulder positioning.',
    };

    return specifics[exerciseName] || 'Focus on proper form, full range of motion, and controlled movement tempo.';
  }

  /**
   * Auto-generate videos for commonly used exercises
   */
  async generateForWorkout(exerciseIds: string[]): Promise<FormVideo[]> {
    const promises = exerciseIds.map(id => 
      this.generateForExercise(id).catch(err => {
        console.error(`Failed to generate video for exercise ${id}:`, err);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((video): video is FormVideo => video !== null);
  }

  /**
   * Check if video exists and is completed
   */
  async hasCompletedVideo(exerciseId: string): Promise<boolean> {
    try {
      const video = await this.getVideo(exerciseId);
      return video?.status === 'completed' && !!video.videoUrl;
    } catch {
      return false;
    }
  }
}

export const exerciseFormVideoService = new ExerciseFormVideoService();
export type { FormVideoRequest, FormVideo };