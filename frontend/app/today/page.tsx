'use client';

import { tokens } from '@/lib/design-tokens';
import { Activity, Calendar, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with actual data from backend
const mockDailyPlan = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  programType: 'Strength' as const,
  nextLifts: ['Back Squat', 'Romanian Deadlift', 'Leg Press'],
  readiness: 82,
  streak: 12,
  qualityPRs: 3,
  hasActiveWorkout: false,
};

export default function TodayPage() {
  return (
    <main
      className="min-h-screen p-4 pb-20"
      style={{ backgroundColor: tokens.colors.background.primary }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            color: tokens.colors.text.primary,
            fontSize: tokens.typography.title.size,
            fontWeight: tokens.typography.title.weight,
          }}
        >
          Today
        </h1>
        <p style={{ color: tokens.colors.text.secondary, fontSize: tokens.typography.body.size }}>
          {mockDailyPlan.date}
        </p>
      </div>

      {/* Daily Plan Card */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          backgroundColor: tokens.colors.background.secondary,
          borderRadius: tokens.radius.xl,
        }}
      >
        {/* Program Badge */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: tokens.colors.background.elevated,
              color: tokens.colors.accent.primary,
            }}
          >
            {mockDailyPlan.programType}
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: tokens.colors.text.secondary }} />
            <span style={{ color: tokens.colors.text.secondary, fontSize: '14px' }}>
              Readiness: {mockDailyPlan.readiness}%
            </span>
          </div>
        </div>

        {/* Next Lifts */}
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.heading.size }}
        >
          Today's Lifts
        </h2>
        <div className="space-y-2 mb-5">
          {mockDailyPlan.nextLifts.map((lift, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: tokens.colors.background.tertiary }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: tokens.colors.accent.primary,
                  color: tokens.colors.text.primary,
                }}
              >
                {index + 1}
              </div>
              <span style={{ color: tokens.colors.text.primary, fontSize: '16px' }}>{lift}</span>
            </div>
          ))}
        </div>

        {/* Start Workout Button */}
        <Link href="/train">
          <button
            className="w-full py-4 rounded-xl font-semibold text-white transition-opacity active:opacity-80"
            style={{
              backgroundColor: tokens.colors.accent.primary,
              borderRadius: tokens.radius.lg,
              minHeight: tokens.touchTarget.min,
            }}
          >
            {mockDailyPlan.hasActiveWorkout ? 'Resume Workout' : 'Start Workout'}
          </button>
        </Link>
      </div>

      {/* Streak & Quality PRs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Streak Chip */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: tokens.colors.background.secondary,
            borderRadius: tokens.radius.lg,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} style={{ color: tokens.colors.accent.warning }} />
            <span
              className="text-sm font-medium"
              style={{ color: tokens.colors.text.secondary }}
            >
              Streak
            </span>
          </div>
          <p
            className="text-2xl font-bold"
            style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.number.small }}
          >
            {mockDailyPlan.streak} days
          </p>
        </div>

        {/* Quality PRs Chip */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: tokens.colors.background.secondary,
            borderRadius: tokens.radius.lg,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} style={{ color: tokens.colors.accent.success }} />
            <span
              className="text-sm font-medium"
              style={{ color: tokens.colors.text.secondary }}
            >
              Quality PRs
            </span>
          </div>
          <p
            className="text-2xl font-bold"
            style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.number.small }}
          >
            {mockDailyPlan.qualityPRs} this week
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: tokens.colors.background.secondary,
          borderRadius: tokens.radius.xl,
        }}
      >
        <h3
          className="text-base font-semibold mb-3"
          style={{ color: tokens.colors.text.primary }}
        >
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link href="/history">
            <button
              className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-opacity active:opacity-70"
              style={{
                backgroundColor: tokens.colors.background.tertiary,
                color: tokens.colors.text.primary,
              }}
            >
              <Calendar size={20} />
              <span>View History</span>
            </button>
          </Link>
          <Link href="/profile">
            <button
              className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-opacity active:opacity-70"
              style={{
                backgroundColor: tokens.colors.background.tertiary,
                color: tokens.colors.text.primary,
              }}
            >
              <Activity size={20} />
              <span>Edit Program</span>
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
