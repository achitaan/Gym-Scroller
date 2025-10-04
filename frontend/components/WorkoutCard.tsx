"use client";

import { Workout } from "@/lib/hevy-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface WorkoutCardProps {
  workout: Workout;
  onClick?: () => void;
}

/**
 * WorkoutCard displays a summary of a workout session
 * Hevy UX pattern: Clean cards with key metrics (date, duration, volume) for quick scanning
 */
export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 rounded-2xl border-neutral-200 dark:border-neutral-800"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{workout.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <Calendar className="h-4 w-4" />
              <span>{format(workout.date, "MMM d, yyyy")}</span>
            </div>
          </div>
          <Badge variant={workout.completed ? "default" : "secondary"}>
            {workout.completed ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
              <Clock className="h-4 w-4" />
              <span>{workout.duration || 0} min</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
              <TrendingUp className="h-4 w-4" />
              <span>{workout.totalVolume?.toLocaleString() || 0} kg</span>
            </div>
          </div>
          <div className="text-neutral-500 dark:text-neutral-400">
            {completedSets}/{totalSets} sets
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {workout.exercises.slice(0, 3).map((ex) => (
            <Badge key={ex.id} variant="outline" className="text-xs">
              {ex.name}
            </Badge>
          ))}
          {workout.exercises.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{workout.exercises.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
