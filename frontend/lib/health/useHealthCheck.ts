import { useEffect, useState, useCallback } from 'react';

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

  const checkHealth = useCallback(() => {
    let isCancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const response = await fetch(`${apiUrl}/actuator/health/readiness`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Timeout after 5 seconds
          signal: AbortSignal.timeout(5000),
        });

        if (!isCancelled) {
          if (response.ok) {
            const data = await response.json();
            setHealth(data);
          } else {
            const data = await response.json().catch(() => ({}));
            setHealth(data);
          }
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
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Poll health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isReady = health?.status === 'UP' && 
    health.checks?.database?.status === 'UP' && 
    health.checks?.redis?.status === 'UP' && 
    health.checks?.['data-collector']?.status === 'UP';

  return { health, loading, error, isReady, checkHealth };
}