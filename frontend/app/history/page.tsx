'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { Filter, Share2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip } from 'recharts';

// Mock data
const vlDistributionData = [
  { range: '0-10%', count: 42, color: tokens.colors.vl.minimal },
  { range: '10-20%', count: 38, color: tokens.colors.vl.low },
  { range: '20-30%', count: 15, color: tokens.colors.vl.moderate },
  { range: '30-40%', count: 5, color: tokens.colors.vl.high },
  { range: '40%+', count: 2, color: tokens.colors.vl.critical },
];

const speedAtLoadData = [
  { load: 60, avgSpeed: 0.85 },
  { load: 80, avgSpeed: 0.72 },
  { load: 100, avgSpeed: 0.58 },
  { load: 120, avgSpeed: 0.45 },
  { load: 140, avgSpeed: 0.32 },
];

const tutTrendData = [
  { date: 'Jan 1', value: 42 },
  { date: 'Jan 8', value: 45 },
  { date: 'Jan 15', value: 48 },
  { date: 'Jan 22', value: 52 },
  { date: 'Jan 29', value: 50 },
  { date: 'Feb 5', value: 55 },
];

const romHitRateData = [
  { date: 'Week 1', value: 78 },
  { date: 'Week 2', value: 82 },
  { date: 'Week 3', value: 85 },
  { date: 'Week 4', value: 88 },
];

export default function HistoryPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <main className="min-h-screen p-4 pb-20" style={{ backgroundColor: tokens.colors.background.primary }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: tokens.colors.text.primary }}>History</h1>
          <p style={{ color: tokens.colors.text.secondary }}>Training analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterOpen(!filterOpen)} className="p-3 rounded-xl" style={{ backgroundColor: tokens.colors.background.secondary }}>
            <Filter size={20} style={{ color: tokens.colors.text.primary }} />
          </button>
          <button className="p-3 rounded-xl" style={{ backgroundColor: tokens.colors.background.secondary }}>
            <Share2 size={20} style={{ color: tokens.colors.text.primary }} />
          </button>
        </div>
      </div>

      {/* Quality PRs */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary, borderLeft: `4px solid ${tokens.colors.accent.success}` }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} style={{ color: tokens.colors.accent.success }} />
          <span className="font-semibold" style={{ color: tokens.colors.text.primary }}>Quality PRs This Month</span>
        </div>
        <p className="text-4xl font-bold mb-1" style={{ color: tokens.colors.text.primary }}>12</p>
        <p className="text-sm" style={{ color: tokens.colors.text.secondary }}>+3 from last month</p>
      </div>

      {/* VL Distribution */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Velocity Loss Distribution</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={vlDistributionData}>
            <XAxis dataKey="range" tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }} />
            <YAxis tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {vlDistributionData.map((entry, index) => (
                <rect key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Speed at Load */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Speed at Fixed Loads</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={speedAtLoadData}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.border.subtle} />
            <XAxis dataKey="load" tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }} />
            <YAxis tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: tokens.colors.background.elevated, border: `1px solid ${tokens.colors.border.default}`, borderRadius: tokens.radius.md, color: tokens.colors.text.primary }} />
            <Line type="monotone" dataKey="avgSpeed" stroke={tokens.colors.accent.primary} strokeWidth={3} dot={{ fill: tokens.colors.accent.primary, r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sessions */}
      <div className="p-5 rounded-xl" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Recent Sessions</h2>
        <div className="space-y-3">
          {[{ date: 'Feb 5', lift: 'Back Squat', sets: 5, quality: 'High' }, { date: 'Feb 3', lift: 'Bench Press', sets: 4, quality: 'Medium' }].map((session, index) => (
            <div key={index} className="p-4 rounded-lg flex justify-between" style={{ backgroundColor: tokens.colors.background.tertiary }}>
              <div>
                <p className="font-medium" style={{ color: tokens.colors.text.primary }}>{session.lift}</p>
                <p className="text-sm" style={{ color: tokens.colors.text.secondary }}>{session.date} • {session.sets} sets</p>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: session.quality === 'High' ? tokens.colors.accent.success : tokens.colors.accent.warning, color: tokens.colors.text.primary }}>{session.quality}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
