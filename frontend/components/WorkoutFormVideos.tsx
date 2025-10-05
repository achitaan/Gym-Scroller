"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useWorkoutFormVideos } from "@/lib/use-exercise-form-video";
import { EXERCISES } from "@/lib/exercise-catalog";

interface WorkoutFormVideosProps {
  exerciseIds: string[];
  workoutName?: string;
}

export function WorkoutFormVideos({ exerciseIds, workoutName = "Workout" }: WorkoutFormVideosProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    videos,
    isLoading,
    error,
    generateAllVideos,
    completedCount,
    totalCount,
  } = useWorkoutFormVideos(exerciseIds);

  const getExerciseName = (id: string) => {
    return EXERCISES.find(e => e.id === id)?.name || `Exercise ${id}`;
  };

  const getVideoStatus = (exerciseId: string) => {
    const video = videos[exerciseId];
    if (!video) return 'none';
    return video.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Video className="h-4 w-4 text-gray-400" />;
    }
  };

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {workoutName} Form Videos
          </CardTitle>
          <Badge variant="outline">
            {completedCount}/{totalCount} Ready
          </Badge>
        </div>
        {totalCount > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              {completedCount === totalCount 
                ? "All form videos ready!" 
                : `${totalCount - completedCount} videos needed`
              }
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={generateAllVideos}
            disabled={isLoading || totalCount === 0}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate All Form Videos
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={totalCount === 0}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Exercise Form Videos:</h4>
            <div className="space-y-2">
              {exerciseIds.map((exerciseId) => {
                const status = getVideoStatus(exerciseId);
                const video = videos[exerciseId];
                
                return (
                  <div
                    key={exerciseId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span className="font-medium">{getExerciseName(exerciseId)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {status === 'none' ? 'Not Generated' : 
                         status === 'pending' ? 'Queued' :
                         status === 'processing' ? 'Generating' :
                         status === 'completed' ? 'Ready' : 'Failed'}
                      </Badge>
                      
                      {video?.videoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.videoUrl, '_blank')}
                          className="h-6 px-2"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedCount === totalCount && totalCount > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">All form videos are ready!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              You can now view proper form guidance for every exercise in your workout.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}