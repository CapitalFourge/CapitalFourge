import { useEffect, useState, useCallback, useRef } from 'react';

interface HealthStatus {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  checks: {
    database?: { status: string; details?: string };
    redis?: { status: string; details?: string };
    'data-collector'?: { status: string; details?: string };
  };
  timestamp: string;
}

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  // Async function OUTSIDE useCallback
  async function doHealthCheck() {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const response = await fetch(`${apiUrl}/actuator/health/readiness`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const data = await response.json().catch(() => ({}));
      return data;
    }
  }

  // Sync callback that triggers async via state
  const checkHealth = useCallback(() => {
    setTrigger(t => t + 1);
  }, []);

  // Handle async in useEffect
  useEffect(() => {
    if (trigger === 0) return; // Skip initial render

    let isCancelled = false;

    const runCheck = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await doHealthCheck();
        if (!isCancelled) {
          setHealth(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Health check failed');
          setHealth({
            status: 'DOWN',
            checks: {},
            timestamp: new Date().toISOString(),
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    runCheck();

    return () => {
      isCancelled = true;
    };
  }, [trigger]);

  // Poll health every 30 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isReady = health?.status === 'UP' &&
    health.checks?.database?.status === 'UP' &&
    health.checks?.redis?.status === 'UP' &&
    health.checks?.['data-collector']?.status === 'UP';

  return { health, loading, error, isReady, checkHealth };
}