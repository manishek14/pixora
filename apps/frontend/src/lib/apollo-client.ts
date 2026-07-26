// Token management + endpoint constants used by client-side code.
// The Apollo client itself is created in /src/app/apollo-provider.tsx.

const TOKEN_KEY = 'lenz_access_token';
const REFRESH_TOKEN_KEY = 'lenz_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// IMPORTANT: We deliberately route through Next.js's own origin (/api/graphql)
// rather than hitting the backend port directly. The Next.js dev server proxies
// this to http://localhost:4000/graphql (see next.config.mjs → rewrites()).
// This kills CORS preflights AND avoids "Failed to fetch" when the user's
// browser cannot reach port 4000 directly (adblockers, proxy environments,
// remote dev containers with only :3000 forwarded, etc).
export const GRAPHQL_ENDPOINT = '/api/graphql';

// Keep BACKEND_URL as an alias for backwards-compat with any older imports.
export const BACKEND_URL = GRAPHQL_ENDPOINT;

// Upload endpoint (also proxied through Next.js).
export const UPLOAD_ENDPOINT = '/api/uploads/multiple';
export const UPLOAD_SINGLE_ENDPOINT = '/api/uploads/single';
