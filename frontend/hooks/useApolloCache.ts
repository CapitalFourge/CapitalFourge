"use client";

import { useRef, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

export function useApolloCache() {
  const client = useApolloClient();

  const clearUserCache = async () => {
    if (typeof window === 'undefined') return;
    await client.clearStore();
  };

  const refetchUserQueries = async () => {
    if (typeof window === 'undefined') return;
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
  // We can't use the hook here - return a function that lazily gets the client
  return null;
}