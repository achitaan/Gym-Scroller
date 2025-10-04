"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Navbar } from "@/components/Navbar";
import { Plus, Flame, Dumbbell, TrendingUp } from "lucide-react";
import { mockUserStats, todaysWorkout } from "@/lib/mock-data";

/**
 * Home Dashboard
 * Hevy UX pattern: Quick overview with user stats, active streak, and today's workout
 * Floating action button for starting new workouts (bottom right, always accessible)
 */
export default function Home() {
  const router = useRouter();
  const [stats] = useState(mockUserStats);
  const [currentWorkout] = useState(todaysWorkout);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header with user info */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
              {stats.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Welcome back, {stats.name.split(' ')[0]}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Let's crush today's workout
            </p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-2xl font-bold">{stats.streak}</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Day Streak</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
              <Dumbbell className="h-4 w-4" />
              <span className="text-2xl font-bold">{stats.totalWorkouts}</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Workouts</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-2xl font-bold">{Math.round(stats.totalVolume / 1000)}k</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total kg</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-6 space-y-6">
        {/* Today's Workout Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Today's Workout</h2>
          <WorkoutCard
            workout={currentWorkout}
            onClick={() => router.push(`/workout/${currentWorkout.id}`)}
          />
        </section>

        {/* Stats cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4">This Week</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="Workouts"
              value="3"
              subtitle="This week"
              trend="up"
            />
            <StatsCard
              title="Volume"
              value="22.8k"
              subtitle="kg lifted"
              trend="up"
            />
          </div>
        </section>
      </main>

      {/* Floating action button */}
      <Button
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        onClick={() => router.push('/workout/new')}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom navigation */}
      <Navbar />
    </div>
  );
}
