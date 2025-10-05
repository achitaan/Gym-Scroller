import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizeUrl, getEnv } from '../_utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { clientId } = getEnv();
    const origin = new URL(req.url).origin;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;
    const authorizeUrl = buildAuthorizeUrl(clientId, redirectUri);
    return NextResponse.json({
      origin,
      redirectUri,
      clientId: clientId.slice(0, 6) + '…',
      authorizeUrl,
      note: 'Add redirectUri to your Spotify app Redirect URIs exactly, then Save.'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'diagnostics_failed' }, { status: 500 });
  }
}
