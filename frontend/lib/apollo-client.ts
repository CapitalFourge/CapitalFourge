import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
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

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});