"use client";

import { useState } from "react";
import { Exercise, Set } from "@/lib/hevy-types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Video, X } from "lucide-react";
import { ExerciseFormVideo } from "./ExerciseFormVideo";

interface ExerciseItemProps {
  exercise: Exercise;
  onSetUpdate?: (setId: string, updates: Partial<Set>) => void;
}

/**
 * ExerciseItem displays an exercise with expandable set inputs
 * Hevy UX pattern: Accordion-based expandable lists for clean, scannable workout views
 * Each set has inline editable fields for reps, weight, and completion tracking
 * Enhanced with AI form video generation for proper exercise technique
 */
export function ExerciseItem({ exercise, onSetUpdate }: ExerciseItemProps) {
  const completedSets = exercise.sets.filter(s => s.completed).length;
  const [showFormVideo, setShowFormVideo] = useState(false);

  return (
    <div className="w-full">
      {/* Always visible header with form video button */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <Dumbbell className="h-4 w-4 text-neutral-900 dark:text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">{exercise.name}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {completedSets}/{exercise.sets.length} sets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {exercise.category}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowFormVideo(!showFormVideo);
            }}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
            title={showFormVideo ? "Close form video" : "Show form video"}
          >
            {showFormVideo ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Close
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-1" />
                Form Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Video Section */}
      {showFormVideo && (
        <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <ExerciseFormVideo
            exerciseName={exercise.name}
            exerciseId={exercise.id}
            onClose={() => setShowFormVideo(false)}
          />
        </div>
      )}

      {/* Collapsible Exercise Details */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={exercise.id} className="border-neutral-200 dark:border-neutral-800">
          <AccordionTrigger className="hover:no-underline bg-white dark:bg-neutral-900 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">Exercise Details</span>
            </div>
          </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            {/* Form Video Section */}
            {showFormVideo && (
              <div className="px-4">
                <ExerciseFormVideo
                  exerciseName={exercise.name}
                  exerciseId={exercise.id}
                  onClose={() => setShowFormVideo(false)}
                />
              </div>
            )}

            {/* Set headers */}
            <div className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <div>SET</div>
              <div>REPS</div>
              <div>WEIGHT (KG)</div>
              <div>✓</div>
            </div>

            {/* Set rows */}
            {exercise.sets.map((set, index) => (
              <div
                key={set.id}
                className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 px-4 items-center"
              >
                <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {index + 1}
                </div>
                <Input
                  type="number"
                  value={set.reps || ""}
                  onChange={(e) =>
                    onSetUpdate?.(set.id, { reps: parseInt(e.target.value) || 0 })
                  }
                  className="h-9"
                  placeholder="0"
                />
                <Input
                  type="number"
                  value={set.weight || ""}
                  onChange={(e) =>
                    onSetUpdate?.(set.id, { weight: parseFloat(e.target.value) || 0 })
                  }
                  className="h-9"
                  placeholder="0"
                  step="0.5"
                />
                <Checkbox
                  checked={set.completed}
                  onCheckedChange={(checked) =>
                    onSetUpdate?.(set.id, { completed: checked as boolean })
                  }
                />
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  );
}
