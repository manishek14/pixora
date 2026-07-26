'use client';

import {
  ApolloLink,
  HttpLink,
  concat,
  fromPromise,
  type Operation,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';
import {
  getAccessToken,
  setTokens,
  clearTokens,
  GRAPHQL_ENDPOINT,
} from '@/lib/apollo-client';
import { tryRefreshToken } from '@/lib/refresh';
import { toPersianError, isSessionError } from '@/lib/error-map';
import { toast } from '@/lib/toast-store';

// ─────────────────────────────────────────────────────────────────────────────
// 1) Auth link — inject Bearer token on every operation
// ─────────────────────────────────────────────────────────────────────────────
const authLink = new ApolloLink((operation, forward) => {
  const token = getAccessToken();
  if (token) {
    operation.setContext({
      headers: { authorization: `Bearer ${token}` },
    });
  }
  return forward(operation);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Error link — catch network errors, attempt refresh on 401, show toasts
// ─────────────────────────────────────────────────────────────────────────────
// Track operations we've already retried after a refresh — prevents infinite loops
const retriedOperations = new WeakSet<Operation>();

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    // 401 from `me` / `logout` etc → try refresh, then retry once
    const has401 =
      networkError && (networkError as any)?.statusCode === 401 ||
      (graphQLErrors || []).some(
        (e) => (e as any)?.extensions?.code === 'UNAUTHENTICATED' ||
               (e as any)?.extensions?.exception?.status === 401,
      );

    if (has401 && !retriedOperations.has(operation)) {
      retriedOperations.add(operation);
      return fromPromise(
        tryRefreshToken().then((ok) => {
          if (!ok) {
            // Refresh failed → clear and let UI redirect to /login
            clearTokens();
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            throw new Error('session expired');
          }
          // Update the headers on the original operation with new token
          const newToken = getAccessToken();
          operation.setContext({
            headers: { authorization: `Bearer ${newToken}` },
          });
        }),
      ).flatMap(() => forward(operation));
    }

    // For all other errors — show a toast (deduplicated per-operation)
    const errObj = { graphQLErrors, networkError };
    const persianMsg = toPersianError(errObj);

    // Don't toast "session expired" — the redirect already handles it
    if (!isSessionError(errObj)) {
      // Avoid toast spam: only toast if the operation isn't a `Me` query
      // (those fail silently when not logged in)
      const opName = operation?.operationName || '';
      if (opName !== 'Me') {
        toast.error(persianMsg);
      }
    }

    return;
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3) Build the client
// ─────────────────────────────────────────────────────────────────────────────
function makeClient() {
  const http = new HttpLink({
    uri: GRAPHQL_ENDPOINT, // proxied via Next.js — no CORS, no "Failed to fetch"
    fetchOptions: { cache: 'no-store' },
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        User: { keyFields: ['id'] },
        Post: { keyFields: ['id'] },
        Comment: { keyFields: ['id'] },
      },
    }),
    link: concat(authLink, concat(errorLink, http)),
    defaultOptions: {
      query: { fetchPolicy: 'network-only' },
      watchQuery: { fetchPolicy: 'network-only' },
    },
  });
}

export function ApolloProvider({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>
  );
}

// Re-export token setters for the AuthProvider
export { setTokens, clearTokens };
