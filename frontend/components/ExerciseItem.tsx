"use client";

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
import { Dumbbell } from "lucide-react";

interface ExerciseItemProps {
  exercise: Exercise;
  onSetUpdate?: (setId: string, updates: Partial<Set>) => void;
}

/**
 * ExerciseItem displays an exercise with expandable set inputs
 * Hevy UX pattern: Accordion-based expandable lists for clean, scannable workout views
 * Each set has inline editable fields for reps, weight, and completion tracking
 */
export function ExerciseItem({ exercise, onSetUpdate }: ExerciseItemProps) {
  const completedSets = exercise.sets.filter(s => s.completed).length;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={exercise.id} className="border-neutral-200 dark:border-neutral-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">{exercise.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {completedSets}/{exercise.sets.length} sets
                </p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {exercise.category}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
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
  );
}
