/* Client-side Spotify Web API helper using Authorization Code with PKCE.
   Works in client components only. Stores tokens in localStorage and refreshes when needed. */

export type SpotifySong = { name: string; artists: string; playlist: string };

type TokenSet = {
  access_token: string;
  token_type: 'Bearer';
  scope: string;
  expires_in: number;
  expires_at: number; // epoch ms
  refresh_token?: string;
};

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';
const TOKEN_KEY = 'spotify_token_set_v1';
const CODE_VERIFIER_KEY = 'spotify_code_verifier_v1';

function getClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
}

function getEnvRedirect(): string | undefined {
  return process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier(length = 128): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < array.length; i++) out += charset[array[i] % charset.length];
  return out;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

function saveToken(t: TokenSet) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}
function loadToken(): TokenSet | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as TokenSet; } catch { return null; }
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function computeRedirectUri(pathname = '/today'): string {
  const envUri = getEnvRedirect();
  if (envUri) return envUri;
  return `${window.location.origin}${pathname}`;
}

async function exchangeCodeForToken(code: string, redirectUri: string, clientId: string): Promise<TokenSet> {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE code_verifier');
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Failed to exchange code for token');
  const json = await res.json();
  const set: TokenSet = {
    access_token: json.access_token,
    token_type: 'Bearer',
    scope: json.scope,
    expires_in: json.expires_in,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
  };
  saveToken(set);
  return set;
}

async function refreshAccessToken(clientId: string): Promise<TokenSet | null> {
  const current = loadToken();
  if (!current?.refresh_token) return null;
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: current.refresh_token,
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) { clearToken(); return null; }
  const json = await res.json();
  const next: TokenSet = {
    access_token: json.access_token,
    token_type: 'Bearer',
    scope: json.scope ?? current.scope,
    expires_in: json.expires_in ?? 3600,
    refresh_token: json.refresh_token ?? current.refresh_token,
    expires_at: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
  };
  saveToken(next);
  return next;
}

async function getValidAccessToken(clientId: string): Promise<string | null> {
  let set = loadToken();
  if (!set) return null;
  if (Date.now() > set.expires_at - 5000) set = (await refreshAccessToken(clientId)) ?? null;
  return set?.access_token ?? null;
}

async function spFetch(path: string, clientId: string): Promise<any> {
  const token = await getValidAccessToken(clientId);
  if (!token) throw new Error('Not authenticated with Spotify');
  const res = await fetch(`${SPOTIFY_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify error ${res.status}`);
  return res.json();
}

export const spotify = {
  isConfigured(): boolean {
    return Boolean(getClientId());
  },
  isAuthenticated(): boolean {
    return Boolean(loadToken());
  },
  beginLogin: async (scopes: string[] = ['playlist-read-private', 'user-read-email', 'user-read-private'], redirectPath = '/today') => {
    const clientId = getClientId();
    if (!clientId) throw new Error('Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
    const verifier = generateCodeVerifier();
    sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes.join(' '),
      redirect_uri: computeRedirectUri(redirectPath),
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    window.location.href = `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`;
  },
  // Returns true if code was handled, false if no code in URL
  handleCallback: async (redirectPath = '/today'): Promise<boolean> => {
    const clientId = getClientId();
    if (!clientId) throw new Error('Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const err = url.searchParams.get('error');
    if (err) throw new Error(err);
    if (!code) return false;
    await exchangeCodeForToken(code, computeRedirectUri(redirectPath), clientId);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
    return true;
  },
  logout: () => {
    clearToken();
  },
  // Fetch one song from the first owned playlist with tracks
  getOneSongFromOwnedPlaylists: async (): Promise<SpotifySong> => {
    const clientId = getClientId();
    if (!clientId) throw new Error('Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
    const me = await spFetch('/me', clientId);
    const firstPage = await spFetch('/me/playlists?limit=50', clientId);
    const owned = (firstPage.items || []).filter((p: any) => p.owner?.id === me.id && p.tracks?.total > 0);
    if (owned.length === 0) throw new Error('No owned playlists with tracks found.');
    const playlist = owned[0];
    const tracksPage = await spFetch(`/playlists/${playlist.id}/tracks?limit=1`, clientId);
    const item = tracksPage.items?.[0];
    const track = item?.track;
    if (!track) throw new Error('No tracks found in the selected playlist.');
    return {
      name: track.name,
      artists: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      playlist: playlist.name,
    };
  },
};
