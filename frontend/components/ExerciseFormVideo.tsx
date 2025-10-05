"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2, Video, X, Settings } from "lucide-react";
import { useExerciseFormVideo } from "@/lib/use-exercise-form-video";
import { useState } from "react";

interface ExerciseFormVideoProps {
  exerciseName: string;
  exerciseId: string;
  onClose?: () => void;
}

export function ExerciseFormVideo({ exerciseName, exerciseId, onClose }: ExerciseFormVideoProps) {
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [includeCommonMistakes, setIncludeCommonMistakes] = useState(true);
  const [includeCues, setIncludeCues] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const {
    video,
    isLoading,
    isGenerating,
    error,
    generateVideo,
    hasVideo,
    isCompleted,
  } = useExerciseFormVideo(exerciseId, exerciseName);

  const handleGenerateVideo = () => {
    generateVideo({
      difficulty,
      includeCommonMistakes,
      includeCues,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      processing: 'secondary',
      completed: 'default',
      error: 'destructive',
    } as const;

    const labels = {
      pending: 'Queued',
      processing: 'Generating...',
      completed: 'Ready',
      error: 'Failed',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          Form Guide: {exerciseName}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!hasVideo && !isLoading && (
          <div className="text-center py-8 space-y-4">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Generate an AI form instruction video for {exerciseName}
            </p>
            
            {/* Settings Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {showSettings ? 'Hide Settings' : 'Video Settings'}
            </Button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-left">
                <div>
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="beginner">Beginner - Basic form and safety</option>
                    <option value="intermediate">Intermediate - Standard technique</option>
                    <option value="advanced">Advanced - Performance optimization</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mistakes"
                    checked={includeCommonMistakes}
                    onChange={(e) => setIncludeCommonMistakes(e.target.checked)}
                  />
                  <label htmlFor="mistakes" className="text-sm">Include common mistakes</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cues"
                    checked={includeCues}
                    onChange={(e) => setIncludeCues(e.target.checked)}
                  />
                  <label htmlFor="cues" className="text-sm">Include coaching cues</label>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleGenerateVideo} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Generate Form Video
                </>
              )}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading existing video...</p>
          </div>
        )}

        {video && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{video.exerciseName}</h3>
              {getStatusBadge(video.status)}
            </div>

            {video.status === 'processing' && (
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
                  <p className="text-sm text-neutral-600">Generating your form video...</p>
                  <p className="text-xs text-neutral-500">This may take 30-60 seconds</p>
                </div>
              </div>
            )}

            {video.status === 'completed' && video.videoUrl && (
              <div className="space-y-3">
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={video.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="text-xs text-neutral-500 space-y-1">
                  <p>Generated with Veo2 AI • Variation: {video.variation}</p>
                  <p>Created: {new Date(video.createdAt).toLocaleString()}</p>
                  {video.completedAt && (
                    <p>Completed: {new Date(video.completedAt).toLocaleString()}</p>
                  )}
                </div>
                
                <details className="text-xs">
                  <summary className="cursor-pointer text-neutral-600 hover:text-neutral-800">
                    View AI Prompt
                  </summary>
                  <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded text-neutral-600">
                    {video.prompt}
                  </div>
                </details>
              </div>
            )}

            {video.status === 'failed' && (
              <div className="aspect-video bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800">
                <div className="text-center space-y-2">
                  <Video className="h-8 w-8 mx-auto text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">Video generation failed</p>
                  <p className="text-xs text-red-500">{video.error || 'Please try again'}</p>
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {(!video.videoUrl && video.status !== 'processing' && video.status !== 'failed') && (
              <Button 
                onClick={handleGenerateVideo} 
                disabled={isGenerating}
                variant="outline"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Generate New Video
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}