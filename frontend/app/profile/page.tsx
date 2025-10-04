'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { ChevronRight, Dumbbell, Music, Heart, Type, Contrast, Vibrate } from 'lucide-react';
import type { ProgramType } from '@/lib/types';

export default function ProfilePage() {
  const [currentProgram, setCurrentProgram] = useState<ProgramType>('strength');
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [hapticsOnly, setHapticsOnly] = useState(false);
  const [musicLinked, setMusicLinked] = useState(false);
  const [healthSharing, setHealthSharing] = useState(false);

  const programs: { type: ProgramType; label: string; desc: string }[] = [
    { type: 'strength', label: 'Strength', desc: '10-20% VL, focus on speed & power' },
    { type: 'hypertrophy', label: 'Hypertrophy', desc: '20-30% VL, focus on TUT & ROM' },
    { type: 'technique', label: 'Technique', desc: '<10% VL, strict quality' },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="relative w-12 h-7 rounded-full transition-colors"
      style={{ backgroundColor: value ? tokens.colors.accent.primary : tokens.colors.border.default }}
    >
      <div
        className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
        style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );

  return (
    <main className="min-h-screen p-4 pb-20" style={{ backgroundColor: tokens.colors.background.primary }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ color: tokens.colors.text.primary }}>Profile</h1>
        <p style={{ color: tokens.colors.text.secondary }}>Settings & preferences</p>
      </div>

      {/* Program Selection */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Program Mode</h2>
        <div className="space-y-3">
          {programs.map((prog) => (
            <button
              key={prog.type}
              onClick={() => setCurrentProgram(prog.type)}
              className="w-full p-4 rounded-lg text-left transition-all"
              style={{
                backgroundColor: currentProgram === prog.type ? tokens.colors.background.elevated : tokens.colors.background.tertiary,
                borderLeft: currentProgram === prog.type ? `4px solid ${tokens.colors.accent.primary}` : '4px solid transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1" style={{ color: tokens.colors.text.primary }}>{prog.label}</p>
                  <p className="text-sm" style={{ color: tokens.colors.text.secondary }}>{prog.desc}</p>
                </div>
                {currentProgram === prog.type && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.colors.accent.primary }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Routines */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: tokens.colors.text.primary }}>Routines</h2>
          <button className="text-sm font-medium" style={{ color: tokens.colors.accent.primary }}>+ New</button>
        </div>
        <div className="space-y-2">
          {['Upper Body A', 'Lower Body B', 'Full Body'].map((routine, index) => (
            <button
              key={index}
              className="w-full p-4 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: tokens.colors.background.tertiary }}
            >
              <div className="flex items-center gap-3">
                <Dumbbell size={20} style={{ color: tokens.colors.text.secondary }} />
                <span style={{ color: tokens.colors.text.primary }}>{routine}</span>
              </div>
              <ChevronRight size={20} style={{ color: tokens.colors.text.tertiary }} />
            </button>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music size={20} style={{ color: tokens.colors.text.secondary }} />
              <span style={{ color: tokens.colors.text.primary }}>Music Link</span>
            </div>
            <Toggle value={musicLinked} onChange={() => setMusicLinked(!musicLinked)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={20} style={{ color: tokens.colors.text.secondary }} />
              <span style={{ color: tokens.colors.text.primary }}>Health Sharing</span>
            </div>
            <Toggle value={healthSharing} onChange={() => setHealthSharing(!healthSharing)} />
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="p-5 rounded-xl" style={{ backgroundColor: tokens.colors.background.secondary }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>Accessibility</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type size={20} style={{ color: tokens.colors.text.secondary }} />
              <span style={{ color: tokens.colors.text.primary }}>Large Text</span>
            </div>
            <Toggle value={largeText} onChange={() => setLargeText(!largeText)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Contrast size={20} style={{ color: tokens.colors.text.secondary }} />
              <span style={{ color: tokens.colors.text.primary }}>High Contrast</span>
            </div>
            <Toggle value={highContrast} onChange={() => setHighContrast(!highContrast)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate size={20} style={{ color: tokens.colors.text.secondary }} />
              <span style={{ color: tokens.colors.text.primary }}>Haptics Only</span>
            </div>
            <Toggle value={hapticsOnly} onChange={() => setHapticsOnly(!hapticsOnly)} />
          </div>
        </div>
      </div>
    </main>
  );
}
