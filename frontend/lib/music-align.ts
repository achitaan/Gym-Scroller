// Simple config for aligning a specific timestamp of a song to rep 10
// Place these files under public/music. You can change filenames and targets as you like.

export interface AlignCandidate {
  file: string; // filename in /public/music (e.g., "hype-drop-1.mp3")
  label: string; // friendly name for UI
  target: number; // seconds within the song to align exactly at rep 10
}

// Using the five songs already present (excluding the 10-minute lofi track)
export const ALIGN_CANDIDATES: AlignCandidate[] = [
  {
    file: '24KGoldn - Valentino (Lyrics) - 7clouds (youtube).mp3',
    label: 'Valentino — 24KGoldn',
    target: 25, // default alignment point (adjust as desired)
  },
  {
    file: 'Arizona Zervas - ROXANNE (Lyrics) - 7clouds (youtube).mp3',
    label: 'ROXANNE — Arizona Zervas',
    target: 70,
  },
  {
    file: 'Post Malone - rockstar (Lyrics) ft. 21 Savage - 7clouds (youtube).mp3',
    label: 'rockstar — Post Malone ft. 21 Savage',
    target: 158,
  },
  {
    file: 'Post Malone, Swae Lee - Sunflower (Lyrics) - 7clouds (youtube).mp3',
    label: 'Sunflower — Post Malone, Swae Lee',
    target: 68,
  },
  {
    file: 'Rex Orange County - AMAZING (Lyrics) - Dan Music (youtube).mp3',
    label: 'AMAZING — Rex Orange County',
    target: 77,
  },
];

export const DEFAULT_ALIGN = ALIGN_CANDIDATES[0];
