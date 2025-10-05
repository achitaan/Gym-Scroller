'use client';
import { tokens } from '@/lib/design-tokens';
import { Activity, Calendar, Music4, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXERCISES, findExerciseByName } from '@/lib/exercise-catalog';
import { useEffect, useState } from 'react';
// Server-auth flow: use Next API routes; no direct client secret usage here
type SpotifySong = { name: string; artists: string; playlist: string };

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
  const router = useRouter();
  const [spotifyStatus, setSpotifyStatus] = useState<'idle' | 'authenticating' | 'ready' | 'error'>('idle');
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [spotifySong, setSpotifySong] = useState<SpotifySong | null>(null);

  const getOneSongFromMyPlaylists = async () => {
    try {
      setSpotifyError(null);
      setSpotifyStatus('authenticating');
      // Try server route; if unauthorized, kick off server-side login
      const res = await fetch('/api/spotify/one-song', { cache: 'no-store' });
      if (res.status === 401) {
        const alreadyTried = typeof window !== 'undefined' ? sessionStorage.getItem('spotify_login_inflight') : null;
        if (!alreadyTried) {
          sessionStorage.setItem('spotify_login_inflight', '1');
          window.location.href = '/api/spotify/login';
          return;
        } else {
          // Avoid infinite loop
          sessionStorage.removeItem('spotify_login_inflight');
          setSpotifyStatus('error');
          setSpotifyError('Still not authorized after login. Ensure you returned to the same host (127.0.0.1 vs localhost) and that the redirect URI is whitelisted in Spotify.');
          return;
        }
      }
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as SpotifySong;
      setSpotifySong(json);
      if (typeof window !== 'undefined') sessionStorage.removeItem('spotify_login_inflight');
      setSpotifyStatus('ready');
    } catch (e: any) {
      setSpotifyError(e?.message ?? 'Failed to fetch a song');
      setSpotifyStatus('error');
    }
  };

  // Read any spotify_error from URL when callback redirects to /today
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const err = url.searchParams.get('spotify_error');
    if (err) {
      setSpotifyError(err);
      url.searchParams.delete('spotify_error');
      window.history.replaceState({}, document.title, url.toString());
    }
    // one-time auto fetch if returning from Spotify
    const auto = url.searchParams.get('autofetch');
    if (auto === '1' && !sessionStorage.getItem('spotify_login_inflight')) {
      // clean URL then trigger fetch
      url.searchParams.delete('autofetch');
      window.history.replaceState({}, document.title, url.toString());
      // slight delay to ensure hydration complete
      setTimeout(() => {
        getOneSongFromMyPlaylists();
      }, 50);
    }
  }, []);

  // Determine PPL rotation based on day index (0=Sun)
  const dayIndex = new Date().getDay();
  const rotation = ['Push', 'Pull', 'Legs'];
  const rotationIdx = dayIndex % 3;
  const todayBlock = rotation[rotationIdx] as 'Push' | 'Pull' | 'Legs';

  // Define PPL templates using catalog names
  const PPL_TEMPLATES: Record<typeof todayBlock, string[]> = {
    Push: ['Bench Press', 'Overhead Press', 'Incline Bench Press', 'Lateral Raises', 'Dips'],
    Pull: ['Deadlift', 'Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Barbell Curls'],
    Legs: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Bulgarian Split Squat', 'Calf Raises'],
  } as const;

  const recommendedNames = PPL_TEMPLATES[todayBlock];
  const recommendedExercises = recommendedNames
    .map(name => findExerciseByName(name))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map(exercise => ({ exercise, sets: [{}, {}, {}] }));

  const startRecommended = () => {
    try {
      const payload = JSON.stringify({ exercises: recommendedExercises });
      const b64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(payload))) : '';
      router.push(`/feed?preset=${encodeURIComponent(b64)}`);
    } catch {
      router.push('/feed');
    }
  };

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
          Home
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
        <div className="mb-4">
          <div
            className="px-3 py-1 rounded-full text-sm font-medium inline-block"
            style={{
              backgroundColor: tokens.colors.background.elevated,
              color: tokens.colors.accent.primary,
            }}
          >
            {mockDailyPlan.programType}
          </div>
        </div>

        {/* Recommended Lift */}
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.heading.size }}
        >
          Recommended Lift • {todayBlock}
        </h2>
        <div className="space-y-2 mb-5">
          {recommendedExercises.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: tokens.colors.background.tertiary }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: tokens.colors.accent.primary,
                  color: '#000',
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <div style={{ color: tokens.colors.text.primary, fontSize: '16px' }}>{entry.exercise.name}</div>
                <div className="text-xs" style={{ color: tokens.colors.text.secondary }}>{entry.sets.length} sets • add weights in setup</div>
              </div>
            </div>
          ))}
        </div>

        {/* Start Recommended Button */}
        <button
          onClick={startRecommended}
          className="w-full py-4 rounded-xl font-semibold transition-opacity active:opacity-80"
          style={{
            backgroundColor: tokens.colors.accent.primary,
            color: '#000',
            borderRadius: tokens.radius.lg,
            minHeight: tokens.touchTarget.min,
          }}
        >
          Start Recommended
        </button>
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

      {/* Music: Fetch a song from one of my playlists */}
      <div
        className="rounded-xl p-5 mt-4"
        style={{ backgroundColor: tokens.colors.background.secondary, borderRadius: tokens.radius.xl }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: tokens.colors.background.tertiary }}>
            <Music4 className="h-6 w-6" style={{ color: tokens.colors.text.primary }} />
          </div>
          <div className="text-lg font-semibold" style={{ color: tokens.colors.text.primary }}>
            Music
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={getOneSongFromMyPlaylists}
            className="flex-1 py-3 rounded-xl font-semibold transition-opacity active:opacity-80"
            style={{ backgroundColor: tokens.colors.accent.primary, color: '#000' }}
          >
            Get a song from my playlists
          </button>
        </div>
        {spotifyStatus === 'authenticating' && !spotifyError && (
          <div className="mt-3 text-sm" style={{ color: tokens.colors.text.secondary }}>Working…</div>
        )}
        {spotifyError && (
          <div className="mt-3 text-sm" style={{ color: tokens.colors.accent.error }}>{spotifyError}</div>
        )}
        {spotifySong && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: tokens.colors.background.tertiary }}>
            <div className="text-sm" style={{ color: tokens.colors.text.secondary }}>From: {spotifySong.playlist}</div>
            <div className="font-semibold" style={{ color: tokens.colors.text.primary }}>{spotifySong.name}</div>
            <div className="text-sm" style={{ color: tokens.colors.text.secondary }}>{spotifySong.artists}</div>
          </div>
        )}
      </div>
    </main>
  );
}
