"use client";

import { useRef, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

export function useApolloCache() {
  const clientRef = useRef<ReturnType<typeof useApolloClient> | null>(null);
  
  const getClient = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!clientRef.current) {
      // This will only be called during client-side rendering
      const client = require('@apollo/client').useApolloClient();
      clientRef.current = client;
    }
    return clientRef.current;
  }, []);

  const clearUserCache = async () => {
    const client = getClient();
    if (client) {
      await client.clearStore();
    }
  };
  
  const refetchUserQueries = async () => {
    const client = getClient();
    if (client) {
      await client.refetchQueries({
        include: ['GetDashboardData', 'me', 'portfolios']
      });
    }
  };
  
  return { clearUserCache, refetchUserQueries };
}

export function getApolloClient() {
  // Only use Apollo client during client-side rendering
  if (typeof window === 'undefined') {
    return null;
  }
  // We can't use the hook here - return a function that lazily gets the client
  return null;
}