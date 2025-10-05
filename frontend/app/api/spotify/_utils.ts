import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

export function getEnv() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId) throw new Error('Missing SPOTIFY_CLIENT_ID');
  if (!clientSecret) throw new Error('Missing SPOTIFY_CLIENT_SECRET');
  // Don't enforce redirect here; routes can compute from request origin
  return { clientId, clientSecret } as const;
}

export function buildAuthorizeUrl(clientId: string, redirectUri: string, scopes: string[] = ['playlist-read-private', 'user-read-email', 'user-read-private'], state?: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes.join(' '),
    redirect_uri: redirectUri,
  });
  if (state) params.set('state', state);
  return `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`;
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${creds}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getEnv();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getEnv();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  return res.json();
}

const ACCESS_COOKIE = 'spotify_access_token';
const REFRESH_COOKIE = 'spotify_refresh_token';
const ACCESS_EXP_COOKIE = 'spotify_access_expires';

export function setTokenCookies(res: NextResponse, tokens: any) {
  const isProd = process.env.NODE_ENV === 'production';
  const access = tokens.access_token as string;
  const refresh = tokens.refresh_token as string | undefined;
  const expiresIn = (tokens.expires_in as number) ?? 3600;
  const accessExpires = Date.now() + (expiresIn - 60) * 1000; // refresh early

  res.cookies.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });
  res.cookies.set(ACCESS_EXP_COOKIE, String(accessExpires), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });
  if (refresh) {
    // 30 days
    res.cookies.set(REFRESH_COOKIE, refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function getValidAccessToken(req: NextRequest, res?: NextResponse): Promise<string | null> {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const expStr = req.cookies.get(ACCESS_EXP_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const exp = expStr ? Number(expStr) : 0;

  if (access && Date.now() < exp - 5000) return access;
  if (!refresh) return null;
  try {
    const tokens = await refreshAccessToken(refresh);
    if (!res) return tokens.access_token as string; // if no response to set cookies on
    setTokenCookies(res, tokens);
    return tokens.access_token as string;
  } catch {
    return null;
  }
}

export async function spotifyApiFetch(req: NextRequest, path: string, init?: RequestInit) {
  const res = NextResponse.next();
  let token = await getValidAccessToken(req, res);
  if (!token) return { res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }), didProxy: false };

  let proxy = await fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (proxy.status === 401) {
    token = await getValidAccessToken(req, res);
    if (!token) return { res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }), didProxy: false };
    proxy = await fetch(`${SPOTIFY_API}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return { res: proxy, didProxy: true, cookieResponse: res };
}
