/**
 * Form Video Generation Service
 * Integrates with Veo2 API to generate exercise form instruction videos
 */

import { veo2Client, Veo2VideoRequest, Veo2VideoResponse } from './veo2-client';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  category: string;
  description?: string;
}

export interface FormVideoOptions {
  variation?: 'standard' | 'slow-motion' | 'multi-angle' | 'beginner-focus';
  duration?: number;
  includeCommonMistakes?: boolean;
  includeCues?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface FormVideoResult {
  id: string;
  exerciseId: string;
  exerciseName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  variation: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export class FormVideoService {
  private cacheDir: string;

  constructor(cacheDir: string = './video_cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive form instruction prompt for Veo2
   */
  private generatePrompt(exercise: Exercise, options: FormVideoOptions): string {
    const { variation = 'standard', difficulty = 'intermediate', includeCommonMistakes = true, includeCues = true } = options;
    
    let prompt = `Create a professional fitness instruction video demonstrating proper form for ${exercise.name}.

VISUAL REQUIREMENTS:
- Modern, well-lit gym environment with clean aesthetic
- Athletic person demonstrating perfect form
- Professional sports/fitness cinematography style
- Clear view of movement mechanics from optimal angles
- ${variation === 'multi-angle' ? 'Multiple camera angles (front 40%, side 40%, detail shots 20%)' : 'Primary angle with occasional side view'}
- ${variation === 'slow-motion' ? 'Include slow-motion sequences for key movement phases' : 'Normal speed with controlled tempo'}

EXERCISE DETAILS:
- Exercise: ${exercise.name}
- Target Muscles: ${exercise.muscleGroups.join(', ')}
- Equipment: ${exercise.equipment}
- Difficulty Level: ${difficulty}

INSTRUCTION STRUCTURE:`;

    if (difficulty === 'beginner') {
      prompt += `
1. Setup and starting position (5-7 seconds)
2. Step-by-step movement breakdown (15-20 seconds)
3. Full movement demonstration (5-8 seconds)`;
    } else {
      prompt += `
1. Starting position and setup (3-5 seconds)
2. Movement execution with proper form (20-25 seconds)
3. Key technique points demonstration (5-7 seconds)`;
    }

    if (includeCues) {
      prompt += `

COACHING CUES TO DEMONSTRATE:
- Proper breathing pattern throughout movement
- Core engagement and posture
- Range of motion optimization
- Tempo and control emphasis`;
    }

    if (includeCommonMistakes && variation !== 'beginner-focus') {
      prompt += `

CONTRAST WITH COMMON MISTAKES:
- Show brief incorrect form vs correct form
- Highlight key difference points
- Demonstrate proper correction`;
    }

    prompt += `

PRODUCTION QUALITY:
- 4K resolution, professional lighting
- Smooth camera movements
- Clear subject separation from background
- Athletic wear: fitted, professional gym attire
- ${variation === 'slow-motion' ? '60fps for slow-motion segments' : 'Standard 30fps'}

STYLE: Clean, modern fitness instruction video with cinematic quality and professional presentation.`;

    return prompt.trim();
  }

  /**
   * Generate cache key for video
   */
  private getCacheKey(exerciseId: string, options: FormVideoOptions): string {
    const content = `${exerciseId}_${options.variation || 'standard'}_${options.difficulty || 'intermediate'}_${options.duration || 30}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get cached video data
   */
  private getCachedVideo(cacheKey: string): FormVideoResult | null {
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    
    if (fs.existsSync(cachePath)) {
      try {
        const data = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error('[FormVideoService] Error reading cache:', error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Save video data to cache
   */
  private saveCachedVideo(cacheKey: string, video: FormVideoResult): void {
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify(video, null, 2));
    } catch (error) {
      console.error('[FormVideoService] Error saving cache:', error);
    }
  }

  /**
   * Generate form instruction video
   */
  async generateVideo(exercise: Exercise, options: FormVideoOptions = {}): Promise<FormVideoResult> {
    const cacheKey = this.getCacheKey(exercise.id, options);
    
    // Check cache first
    const cached = this.getCachedVideo(cacheKey);
    if (cached && cached.status === 'completed') {
      return cached;
    }

    // Generate new video
    const prompt = this.generatePrompt(exercise, options);
    
    const veo2Request: Veo2VideoRequest = {
      prompt,
      duration: options.duration || 30,
      aspectRatio: '16:9',
      quality: 'high',
    };

    try {
      const veo2Response = await veo2Client.generateVideo(veo2Request);
      
      const videoResult: FormVideoResult = {
        id: veo2Response.id,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: veo2Response.status as any,
        videoUrl: veo2Response.videoUrl,
        thumbnailUrl: veo2Response.thumbnailUrl,
        prompt,
        variation: options.variation || 'standard',
        createdAt: new Date().toISOString(),
        completedAt: veo2Response.status === 'completed' ? new Date().toISOString() : undefined,
        error: veo2Response.error,
      };

      // Save to cache
      this.saveCachedVideo(cacheKey, videoResult);
      
      return videoResult;

    } catch (error: any) {
      const errorResult: FormVideoResult = {
        id: `error_${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'failed',
        prompt,
        variation: options.variation || 'standard',
        createdAt: new Date().toISOString(),
        error: error.message || 'Video generation failed',
      };

      this.saveCachedVideo(cacheKey, errorResult);
      return errorResult;
    }
  }

  /**
   * Get video by exercise ID and options
   */
  async getVideo(exerciseId: string, options: FormVideoOptions = {}): Promise<FormVideoResult | null> {
    const cacheKey = this.getCacheKey(exerciseId, options);
    return this.getCachedVideo(cacheKey);
  }

  /**
   * Check video status and update if needed
   */
  async checkVideoStatus(videoId: string): Promise<FormVideoResult | null> {
    try {
      const veo2Response = await veo2Client.getVideoStatus(videoId);
      
      // Find cached video by ID
      const cacheFiles = fs.readdirSync(this.cacheDir);
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(this.cacheDir, file), 'utf8');
          const video: FormVideoResult = JSON.parse(data);
          
          if (video.id === videoId) {
            // Update status
            video.status = veo2Response.status as any;
            video.videoUrl = veo2Response.videoUrl || video.videoUrl;
            video.thumbnailUrl = veo2Response.thumbnailUrl || video.thumbnailUrl;
            video.error = veo2Response.error || video.error;
            
            if (veo2Response.status === 'completed' && !video.completedAt) {
              video.completedAt = new Date().toISOString();
            }
            
            // Save updated data
            fs.writeFileSync(path.join(this.cacheDir, file), JSON.stringify(video, null, 2));
            
            return video;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('[FormVideoService] Error checking video status:', error);
      return null;
    }
  }

  /**
   * List all cached videos
   */
  listCachedVideos(): FormVideoResult[] {
    const videos: FormVideoResult[] = [];
    
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir);
      
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(path.join(this.cacheDir, file), 'utf8');
          const video: FormVideoResult = JSON.parse(data);
          videos.push(video);
        }
      }
    } catch (error) {
      console.error('[FormVideoService] Error listing cached videos:', error);
    }
    
    return videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Generate videos for multiple exercises (batch processing)
   */
  async generateBatchVideos(
    exercises: Exercise[], 
    options: FormVideoOptions = {}
  ): Promise<FormVideoResult[]> {
    const results: FormVideoResult[] = [];
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 3;
    
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      
      const batchPromises = batch.map(exercise => 
        this.generateVideo(exercise, options).catch(error => {
          console.error(`[FormVideoService] Failed to generate video for ${exercise.name}:`, error);
          return {
            id: `error_${Date.now()}_${exercise.id}`,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            status: 'failed' as const,
            prompt: '',
            variation: options.variation || 'standard',
            createdAt: new Date().toISOString(),
            error: error.message || 'Video generation failed',
          };
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < exercises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export const formVideoService = new FormVideoService();