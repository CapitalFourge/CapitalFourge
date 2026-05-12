import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Function to get the API URI - works on both client and server
const getApiUri = () => {
  // If we're on the client, use window.location
  if (typeof window !== 'undefined') {
    return 'http://' + window.location.hostname + ':8080/graphql';
  }
  // If we're on the server, default to localhost (or could be configured via env)
  return 'http://localhost:8080/graphql';
};

const httpLink = createHttpLink({
  uri: getApiUri(),
});

console.log("[DEBUG] Apollo Client configured for:", getApiUri());

const authLink = setContext((_, { headers }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    console.log("[DEBUG] Auth token retrieved:", !!token);
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    }
});

export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});
