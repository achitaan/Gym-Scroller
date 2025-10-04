'use client';

import { tokens, getVLColor } from '@/lib/design-tokens';
import { X, Share2, Edit3 } from 'lucide-react';
import type { SetSummary } from '@/lib/types';

interface SetSummarySheetProps {
  summary: SetSummary;
  onLog: () => void;
  onEdit: () => void;
  onShare: () => void;
  onClose: () => void;
}

export function SetSummarySheet({ summary, onLog, onEdit, onShare, onClose }: SetSummarySheetProps) {
  const vlColor = getVLColor(summary.vlPercentage);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-3xl p-6"
        style={{
          backgroundColor: tokens.colors.background.secondary,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: tokens.colors.border.default }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
            style={{ color: tokens.colors.text.primary }}
          >
            Set Complete
          </h2>
          <button onClick={onClose} className="p-2 rounded-full active:opacity-70">
            <X size={24} style={{ color: tokens.colors.text.secondary }} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Reps */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              Reps
            </p>
            <p className="text-3xl font-bold" style={{ color: tokens.colors.text.primary }}>
              {summary.reps}
            </p>
          </div>

          {/* TUT */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              TUT
            </p>
            <p className="text-3xl font-bold" style={{ color: tokens.colors.text.primary }}>
              {(summary.tut / 1000).toFixed(1)}s
            </p>
          </div>

          {/* Avg Speed */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              Avg Speed
            </p>
            <p className="text-3xl font-bold" style={{ color: tokens.colors.text.primary }}>
              {summary.avgSpeed.toFixed(2)}
            </p>
            <p className="text-xs" style={{ color: tokens.colors.text.tertiary }}>m/s</p>
          </div>

          {/* VL% */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              Velocity Loss
            </p>
            <p className="text-3xl font-bold" style={{ color: vlColor }}>
              {summary.vlPercentage.toFixed(1)}%
            </p>
          </div>

          {/* ROM Hit Rate */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              ROM Hit Rate
            </p>
            <p className="text-3xl font-bold" style={{ color: tokens.colors.text.primary }}>
              {(summary.romHitRate * 100).toFixed(0)}%
            </p>
          </div>

          {/* ROM Variability */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          >
            <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
              ROM Consistency
            </p>
            <p className="text-3xl font-bold" style={{ color: tokens.colors.text.primary }}>
              {((1 - summary.romVariability) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Coaching Tip */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: tokens.colors.background.elevated,
            borderLeft: `4px solid ${tokens.colors.accent.primary}`,
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: tokens.colors.text.secondary }}>
            Tip
          </p>
          <p style={{ color: tokens.colors.text.primary }}>{summary.tip}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onLog}
            className="w-full py-4 rounded-xl font-semibold text-white active:opacity-80"
            style={{
              backgroundColor: tokens.colors.accent.primary,
              minHeight: tokens.touchTarget.min,
            }}
          >
            Log & Next Set
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium active:opacity-80"
              style={{
                backgroundColor: tokens.colors.background.tertiary,
                color: tokens.colors.text.primary,
              }}
            >
              <Edit3 size={18} />
              Edit
            </button>
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium active:opacity-80"
              style={{
                backgroundColor: tokens.colors.background.tertiary,
                color: tokens.colors.text.primary,
              }}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
