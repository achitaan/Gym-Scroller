"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { ProfileStats } from "@/components/ProfileStats";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { Settings, Moon, Sun, Dumbbell, TrendingUp, Calendar } from "lucide-react";
import { mockUserStats, volumeData } from "@/lib/mock-data";

/**
 * Profile Page
 * Hevy UX pattern: Personal stats overview with visual progress charts
 * Theme toggle for light/dark mode, lifetime stats display
 */
export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [stats] = useState(mockUserStats);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header with avatar and basic info */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-neutral-800 text-white text-2xl font-bold">
                {stats.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{stats.name}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Member since 2024
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalWorkouts}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Workouts</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.streak}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Day Streak</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(stats.totalVolume / 1000)}k
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total kg</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-6 space-y-6">
        {/* Tabs for different views */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6 mt-6">
            {/* Detailed stats */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Lifetime Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Total Workouts"
                  value={stats.totalWorkouts}
                  icon={Dumbbell}
                />
                <StatsCard
                  title="Best Streak"
                  value={`${stats.streak} days`}
                  icon={Calendar}
                />
                <StatsCard
                  title="Total Volume"
                  value={`${Math.round(stats.totalVolume / 1000)}k kg`}
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Body Weight"
                  value={`${stats.currentWeight} kg`}
                />
              </div>
            </section>

            {/* Volume chart */}
            <section>
              <ProfileStats data={volumeData} />
            </section>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Settings section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {theme === "dark" ? "Dark" : "Light"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            </section>

            {/* Account actions */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  Sign Out
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Navbar />
    </div>
  );
}
