"use client";

import { useState, useEffect, useCallback } from 'react';
import { exerciseFormVideoService, FormVideo } from '@/lib/exercise-form-video-service';

interface UseExerciseFormVideoOptions {
  autoLoad?: boolean;
  pollInterval?: number;
}

interface UseExerciseFormVideoReturn {
  video: FormVideo | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateVideo: (options?: {
    includeCommonMistakes?: boolean;
    includeCues?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) => Promise<void>;
  loadVideo: () => Promise<void>;
  hasVideo: boolean;
  isCompleted: boolean;
}

export function useExerciseFormVideo(
  exerciseId: string,
  exerciseName: string,
  options: UseExerciseFormVideoOptions = {}
): UseExerciseFormVideoReturn {
  const { autoLoad = true, pollInterval = 5000 } = options; // Increased from 3000ms to 5000ms
  
  const [video, setVideo] = useState<FormVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVideo = useCallback(async () => {
    if (!exerciseId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const existingVideo = await exerciseFormVideoService.getVideo(exerciseId);
      setVideo(existingVideo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  const generateVideo = useCallback(async (generateOptions: {
    includeCommonMistakes?: boolean;
    includeCues?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  } = {}) => {
    if (!exerciseId || !exerciseName) return;

    setIsGenerating(true);
    setError(null);

    try {
      const newVideo = await exerciseFormVideoService.generateForExercise(
        exerciseId,
        generateOptions
      );
      setVideo(newVideo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  }, [exerciseId, exerciseName]);

  // Auto-load video on mount
  useEffect(() => {
    if (autoLoad && exerciseId) {
      loadVideo();
    }
  }, [loadVideo, autoLoad, exerciseId]);

  // Poll for video completion if status is processing
  useEffect(() => {
    if (!video || video.status !== 'processing') return;

    const pollTimer = setInterval(async () => {
      try {
        const updatedVideo = await exerciseFormVideoService.getVideo(exerciseId);
        if (updatedVideo) {
          setVideo(updatedVideo);
          
          // Stop polling if completed or errored
          if (updatedVideo.status === 'completed' || updatedVideo.status === 'error') {
            clearInterval(pollTimer);
          }
        }
      } catch (err) {
        console.error('Error polling video status:', err);
        // Don't clear the interval immediately - retry a few times
        // Only clear after multiple consecutive failures
        setError(err instanceof Error ? err.message : 'Failed to check video status');
      }
    }, pollInterval);

    // Cleanup timer on unmount or when video changes
    return () => clearInterval(pollTimer);
  }, [video, exerciseId, pollInterval]);

  const hasVideo = video !== null;
  const isCompleted = video?.status === 'completed' && !!video.videoUrl;

  return {
    video,
    isLoading,
    isGenerating,
    error,
    generateVideo,
    loadVideo,
    hasVideo,
    isCompleted,
  };
}

// Hook for batch operations on multiple exercises
export function useWorkoutFormVideos(exerciseIds: string[]) {
  const [videos, setVideos] = useState<Record<string, FormVideo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllVideos = useCallback(async () => {
    if (exerciseIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const videoPromises = exerciseIds.map(async (id) => {
        try {
          const video = await exerciseFormVideoService.getVideo(id);
          return { id, video };
        } catch {
          return { id, video: null };
        }
      });

      const results = await Promise.all(videoPromises);
      const videoMap = results.reduce((acc, { id, video }) => {
        if (video) acc[id] = video;
        return acc;
      }, {} as Record<string, FormVideo>);

      setVideos(videoMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseIds]);

  const generateAllVideos = useCallback(async () => {
    if (exerciseIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const newVideos = await exerciseFormVideoService.generateForWorkout(exerciseIds);
      const videoMap = newVideos.reduce((acc, video) => {
        acc[video.id] = video;
        return acc;
      }, {} as Record<string, FormVideo>);

      setVideos(prev => ({ ...prev, ...videoMap }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate videos');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseIds]);

  useEffect(() => {
    loadAllVideos();
  }, [loadAllVideos]);

  const completedCount = Object.values(videos).filter(
    v => v.status === 'completed' && v.videoUrl
  ).length;

  return {
    videos,
    isLoading,
    error,
    loadAllVideos,
    generateAllVideos,
    completedCount,
    totalCount: exerciseIds.length,
  };
}