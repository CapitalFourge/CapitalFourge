"use client";

import { useApolloClient as useApolloClientHook } from '@apollo/client';

export function useApolloCache() {
  // Only use Apollo client during client-side rendering
  if (typeof window === 'undefined') {
    return { clearUserCache: async () => {}, refetchUserQueries: async () => {} };
  }
  
  const client = useApolloClientHook();
  
  const clearUserCache = async () => {
    // Evict user and portfolio queries from cache
    await client.clearStore();
  };
  
  const refetchUserQueries = async () => {
    // Refetch specific queries
    await client.refetchQueries({
      include: ['GetDashboardData', 'me', 'portfolios']
    });
  };
  
  return { clearUserCache, refetchUserQueries };
}

export function getApolloClient() {
  // Only use Apollo client during client-side rendering
  if (typeof window === 'undefined') {
    return null;
  }
  return useApolloClientHook();
}