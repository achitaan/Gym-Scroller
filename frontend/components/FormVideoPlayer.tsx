'use client';

import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface FormVideoPlayerProps {
  exerciseId: string;
  exerciseName: string;
  autoGenerate?: boolean;
  className?: string;
}

interface VideoData {
  video_id: string;
  video_url: string;
  thumbnail_url: string;
  status: 'completed' | 'generating' | 'error';
  exercise: string;
  duration: number;
  generated_at: string;
}

export function FormVideoPlayer({
  exerciseId,
  exerciseName,
  autoGenerate = false,
  className = '',
}: FormVideoPlayerProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch existing video on mount
  useEffect(() => {
    fetchVideo();
  }, [exerciseId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/form-video/${exerciseId}`);
      const data = await response.json();

      if (data.success) {
        setVideoData(data.video);
      } else if (autoGenerate) {
        // Auto-generate if video doesn't exist
        generateVideo();
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      if (autoGenerate) {
        generateVideo();
      }
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/form-video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise: {
            id: exerciseId,
            name: exerciseName,
            muscleGroups: [], // Add from exercise data
            equipment: 'barbell', // Add from exercise data
          },
          variation: 'standard',
          duration: 30,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoData(data.video);
      } else {
        setError(data.error || 'Failed to generate video');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError('Failed to generate form video');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={generateVideo} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              'Try Again'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!videoData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">AI Form Instruction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Watch an AI-generated video demonstrating proper form for {exerciseName}.
          </p>
          <Button onClick={generateVideo} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Form Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">AI Form Instruction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-full"
            poster={videoData.thumbnail_url}
            preload="metadata"
          >
            <source src={videoData.video_url} type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Duration: {videoData.duration}s</p>
          <p>Generated: {new Date(videoData.generated_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
