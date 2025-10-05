import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, setTokenCookies } from '../_utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const error = searchParams.get('error');
  if (error) return NextResponse.redirect(`/today?spotify_error=${encodeURIComponent(error)}`);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect('/today?spotify_error=missing_code');
  try {
    const origin = new URL(req.url).origin;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;
    const tokens = await exchangeCodeForToken(code, redirectUri);
  const absoluteToday = new URL('/today?autofetch=1', origin).toString();
    const res = NextResponse.redirect(absoluteToday);
    setTokenCookies(res, tokens);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'exchange_failed' }, { status: 500 });
  }
}
