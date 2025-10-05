import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'music');
    const files = await readdir(musicDir).catch(() => []);
    const mp3s = files.filter(f => f.toLowerCase().endsWith('.mp3'));
    return NextResponse.json({ files: mp3s.map(f => `/music/${encodeURIComponent(f)}`) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
