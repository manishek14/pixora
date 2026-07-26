'use client';

import { gql } from '@apollo/client';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './apollo-client';

const REFRESH_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refresh(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

// Singleton: ensures only one refresh request flies at a time even if
// multiple GraphQL operations fail with 401 simultaneously.
let inflight: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns `true` on success (new tokens are persisted), `false` otherwise.
 * On failure the tokens are cleared so the UI can bounce the user to /login.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (inflight) return inflight;

  inflight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return false;
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REFRESH_MUTATION.loc?.source.body,
          variables: { input: { refreshToken } },
        }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const json = await res.json();
      if (json?.errors?.length) {
        clearTokens();
        return false;
      }

      const data = json?.data?.refresh;
      if (!data?.accessToken || !data?.refreshToken) {
        clearTokens();
        return false;
      }

      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// Helper for non-Apollo code (e.g., REST uploads) to check current token
export function currentAccessToken(): string | null {
  return getAccessToken();
}
