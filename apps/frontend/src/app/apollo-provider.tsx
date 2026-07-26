'use client';

import { ApolloLink, HttpLink, concat } from '@apollo/client';
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';
import {
  getAccessToken,
  BACKEND_URL,
} from '@/lib/apollo-client';

// Inject Authorization header on every request (client-side only)
const authMiddleware = new ApolloLink((operation, forward) => {
  const token = getAccessToken();
  if (token) {
    operation.setContext({
      headers: { authorization: `Bearer ${token}` },
    });
  }
  return forward(operation);
});

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        User: { keyFields: ['id'] },
        Post: { keyFields: ['id'] },
      },
    }),
    link: concat(
      authMiddleware,
      new HttpLink({
        uri: BACKEND_URL,
        fetchOptions: { cache: 'no-store' },
      }),
    ),
    defaultOptions: {
      query: { fetchPolicy: 'network-only' },
      watchQuery: { fetchPolicy: 'network-only' },
    },
  });
}

export function ApolloProvider({ children }: React.PropsWithChildren) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
