"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import { calculateWorkoutVolume } from "@/lib/mock-data";
import { loadHistory } from "@/lib/history-storage";
import { format } from "date-fns";

/**
 * Workout History Page
 * Hevy UX pattern: List of previous sessions sorted by date with expandable details
 * Tabs for different time periods (All, Week, Month) for easy filtering
 */
export default function HistoryPage() {
  const router = useRouter();
  const [workouts] = useState(() => {
    const items = loadHistory();
    return items.map(w => ({
      ...w,
      totalVolume: w.totalVolume || calculateWorkoutVolume(w),
    }));
  });

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((groups, workout) => {
    const dateKey = format(workout.date, "MMMM d, yyyy");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(workout);
    return groups;
  }, {} as Record<string, typeof workouts>);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <Calendar className="h-6 w-6 text-neutral-900 dark:text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Workout History</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {workouts.length} workouts completed
            </p>
          </div>
        </div>

        {/* Time filter tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Workout list */}
      <main className="px-6 py-6 space-y-6">
        {Object.entries(groupedWorkouts).map(([date, dateWorkouts]) => (
          <section key={date}>
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">
              {date}
            </h2>
            <div className="space-y-3">
              {dateWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => router.push(`/workout/${workout.id}`)}
                />
              ))}
            </div>
          </section>
        ))}

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              No workouts yet
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Start your first workout to see it here
            </p>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
