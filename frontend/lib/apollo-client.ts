import { ApolloClient, InMemoryCache, createHttpLink, TypePolicies } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { setAuthCookie } from './auth-cookie';

// Get GraphQL endpoint from environment variable
const getGraphQLUri = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the environment variable
    return process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`
      : 'http://localhost:8080/graphql';
  }
  // Server-side: also use environment variable
  return process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`
    : 'http://localhost:8080/graphql';
};

const httpLink = createHttpLink({
  uri: getGraphQLUri(),
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    setAuthCookie(token);
  }
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Cache type policies for proper normalization and refetching
export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      me: {
        // Don't cache user data - always fetch fresh for balance accuracy
        merge: false,
      },
      portfolios: {
        // Merge portfolio arrays instead of replacing
        merge(existing = [], incoming) {
          return incoming;
        },
      },
      assetMovers: {
        merge(existing = [], incoming) {
          return incoming;
        },
      },
    },
  },
  User: {
    keyFields: ['id'],
    fields: {
      cashBalance: {
        merge: false, // Always fetch fresh
      },
      lockedBalance: {
        merge: false, // Always fetch fresh
      },
    },
  },
  Portfolio: {
    keyFields: ['id'],
    fields: {
      positions: {
        merge(existing = [], incoming) {
          return incoming;
        },
      },
      performance: {
        merge: false,
      },
    },
  },
  Position: {
    keyFields: ['id', 'symbol'],
    fields: {
      currentPrice: {
        merge: false,
      },
    },
  },
};

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies,
  }),
});