import { NextRequest, NextResponse } from 'next/server';
import { spotifyApiFetch } from '../_utils';

export async function GET(req: NextRequest) {
  // Get profile
  const meResp = await spotifyApiFetch(req, '/me');
  if (!meResp.didProxy) return meResp.res;
  const me = await meResp.res.json();

  // Get playlists
  let owned: any[] = [];
  let nextUrl: string | null = `/me/playlists?limit=50`;
  // collect up to 200 playlists
  while (nextUrl) {
    const pageResp = await spotifyApiFetch(req, nextUrl);
    if (!pageResp.didProxy) return pageResp.res;
    const page = await pageResp.res.json();
    owned.push(...(page.items || []).filter((p: any) => p.owner?.id === me.id && p.tracks?.total > 0));
    nextUrl = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null;
    if (owned.length >= 200) break;
  }
  if (owned.length === 0) return NextResponse.json({ error: 'no_owned_playlists' }, { status: 404 });

  // pick a random playlist
  const playlist = owned[Math.floor(Math.random() * owned.length)];
  const total: number = playlist.tracks?.total ?? 0;
  if (!total || total <= 0) return NextResponse.json({ error: 'no_tracks' }, { status: 404 });

  // pick a random offset into the playlist and fetch a single track
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const offset = Math.floor(Math.random() * total);
    const trResp = await spotifyApiFetch(req, `/playlists/${playlist.id}/tracks?limit=1&offset=${offset}`);
    if (!trResp.didProxy) return trResp.res;
    const trJson = await trResp.res.json();
    const item = trJson.items?.[0];
    const track = item?.track;
    if (track) {
      return NextResponse.json({
        name: track.name,
        artists: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        playlist: playlist.name,
      });
    }
  }
  return NextResponse.json({ error: 'no_tracks' }, { status: 404 });
}
