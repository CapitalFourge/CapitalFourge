"use client";

import { useMemo } from "react";
import { ApolloClient, InMemoryCache, createHttpLink, TypePolicies } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { setAuthCookie } from "@/lib/auth-cookie";

const getGraphQLUri = () => {
  if (typeof window !== "undefined") {
    return "/api/graphql";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`
    : "http://localhost:10000/graphql";
};

const httpLink = createHttpLink({
  uri: getGraphQLUri(),
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    setAuthCookie(token);
  }
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const typePolicies: TypePolicies = {
  Query: {
    fields: {
      me: {
        merge: false,
      },
      portfolios: {
        merge(existing = [], incoming) {
          return incoming;
        },
      },
      assetMovers: {
        merge(existing, incoming) {
          return incoming;
        },
      },
    },
  },
  User: {
    keyFields: ["id"],
    fields: {
      cashBalance: {
        merge: false,
      },
      lockedBalance: {
        merge: false,
      },
    },
  },
  Portfolio: {
    keyFields: ["id"],
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
    keyFields: ["id", "symbol"],
    fields: {
      currentPrice: {
        merge: false,
      },
    },
  },
};

export function makeClient() {
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies,
    }),
    ssrMode: typeof window === "undefined",
  });
}