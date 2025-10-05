import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizeUrl, getEnv } from '../_utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { clientId } = getEnv();
  const origin = new URL(req.url).origin;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;
  const url = buildAuthorizeUrl(clientId, redirectUri);
  return NextResponse.redirect(url);
}
