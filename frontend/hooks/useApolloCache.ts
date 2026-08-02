"use client";

import { useApolloClient } from '@apollo/client';

export function useApolloCache() {
  const client = useApolloClient();
  
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

export function useApolloClient() {
  const client = useApolloClient();
  return client;
}