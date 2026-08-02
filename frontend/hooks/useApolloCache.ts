"use client";

import { useApolloClient as useApolloClientHook } from '@apollo/client';

export function useApolloCache() {
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
  return useApolloClientHook();
}