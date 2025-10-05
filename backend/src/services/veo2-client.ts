/**
 * Google Veo 2 API Client
 * Integrates with Google's Veo 2 video generation API
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface Veo2VideoRequest {
  prompt: string;
  duration?: number; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  quality?: 'standard' | 'high';
  style?: string;
}

export interface Veo2VideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    duration: number;
    resolution: string;
    createdAt: string;
  };
  error?: string;
}

export class Veo2Client {
  private apiKey: string;
  private baseUrl: string = 'https://aiplatform.googleapis.com/v1beta1';
  private projectId: string;
  private region: string = 'us-central1';

  constructor(apiKey?: string, projectId?: string) {
    this.apiKey = apiKey || process.env.VEO2_API_KEY || '';
    this.projectId = projectId || process.env.GOOGLE_PROJECT_ID || 'gym-scroller-project';
    
    if (!this.apiKey) {
      console.warn('[Veo2Client] No API key provided. Video generation will use mock responses.');
    }
  }

  /**
   * Generate a video using Veo 2
   */
  async generateVideo(request: Veo2VideoRequest): Promise<Veo2VideoResponse> {
    if (!this.apiKey) {
      throw new Error('API key not provided for video generation');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/projects/${this.projectId}/locations/${this.region}/publishers/google/models/veo-2:predict`,
        {
          instances: [{
            prompt: request.prompt,
            video_config: {
              duration_seconds: request.duration || 30,
              aspect_ratio: request.aspectRatio || '16:9',
              quality: request.quality || 'high',
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Goog-User-Project': this.projectId,
          },
          timeout: 120000 // 2 minutes timeout
        }
      );

      const result = response.data.predictions[0];
      
      return {
        id: result.id || this.generateId(),
        status: 'processing',
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        metadata: {
          duration: request.duration || 30,
          resolution: request.quality === 'high' ? '1080p' : '720p',
          createdAt: new Date().toISOString(),
        }
      };

    } catch (error: any) {
      console.error('[Veo2Client] Video generation failed:', error.message);
      
      return {
        id: this.generateId(),
        status: 'failed',
        error: error.message || 'Video generation failed',
        metadata: {
          duration: request.duration || 30,
          resolution: '720p',
          createdAt: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Check the status of a video generation job
   */
  async getVideoStatus(videoId: string): Promise<Veo2VideoResponse> {
    if (!this.apiKey) {
      throw new Error('API key not provided for video status check');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}/locations/${this.region}/operations/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Goog-User-Project': this.projectId,
          }
        }
      );

      const operation = response.data;
      
      if (operation.done) {
        return {
          id: videoId,
          status: operation.error ? 'failed' : 'completed',
          videoUrl: operation.response?.video_url,
          thumbnailUrl: operation.response?.thumbnail_url,
          error: operation.error?.message,
          metadata: {
            duration: 30,
            resolution: '1080p',
            createdAt: operation.metadata?.createTime || new Date().toISOString(),
          }
        };
      } else {
        return {
          id: videoId,
          status: 'processing',
          metadata: {
            duration: 30,
            resolution: '1080p',
            createdAt: operation.metadata?.createTime || new Date().toISOString(),
          }
        };
      }

    } catch (error: any) {
      console.error('[Veo2Client] Status check failed:', error.message);
      
      return {
        id: videoId,
        status: 'failed',
        error: error.message || 'Status check failed',
        metadata: {
          duration: 30,
          resolution: '720p',
          createdAt: new Date().toISOString(),
        }
      };
    }
  }


  /**
   * Generate unique ID for video requests
   */
  private generateId(): string {
    return `veo2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const veo2Client = new Veo2Client();