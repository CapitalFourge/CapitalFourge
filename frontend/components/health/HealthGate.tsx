"use client";

import { useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface HealthCheck {
  status: "UP" | "DOWN";
  timestamp: string;
  checks: Record<string, { status: "UP" | "DOWN"; details: string }>;
}

// Async function OUTSIDE component
async function doHealthCheck(): Promise<HealthCheck> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const response = await fetch(`${baseUrl}/actuator/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  return data;
}

export function HealthGate({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [trigger, setTrigger] = useState(() => (typeof window !== "undefined" ? 1 : 0));
  const cancelledRef = useRef(false);

  // Lazy initializers - avoid setState in effects
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");

  // Loading is derived from trigger state (0 = initial, >0 = checking or done)
  const loading = trigger > 0 && !health;

  // Sync callback that triggers async via state
  const checkHealth = useCallback(() => {
    setTrigger(t => t + 1);
  }, []);

  // Handle async in useEffect
  useEffect(() => {
    if (trigger === 0) return; // Skip initial render

    cancelledRef.current = false;

    const runCheck = async () => {
      try {
        const data = await doHealthCheck();
        if (!cancelledRef.current) {
          setHealth(data);
          if (data.status !== "UP") {
            setError("Algunos servicios no están listos");
          } else {
            setError(null);
          }
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : "Error de conexión");
        }
      }
    };

    runCheck();

    return () => {
      cancelledRef.current = true;
    };
  }, [trigger]);

  useEffect(() => {
    const interval = setInterval(() => setTrigger(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const allUp = health?.status === "UP";

  // Don't block during SSR - only show loading UI after client mount
  if (!mounted) {
    return <>{children}</>;
  }

  if (!allUp) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-dashboard flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-300/10 mb-4">
              <Loader2 className="h-8 w-8 text-emerald-300 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Preparando el entorno</h1>
            <p className="mt-2 text-slate-400 text-sm">
              Verificando que todos los servicios estén listos antes de permitir el acceso
            </p>
          </div>

          <div className="space-y-3 panel rounded-2xl p-5 border border-white/10">
            {health?.checks && Object.entries(health.checks).map(([key, check]) => (
              <ServiceCheck
                key={key}
                name={getServiceName(key)}
                status={check.status === "UP" ? "up" : "down"}
                details={check.details}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 panel-muted rounded-xl p-4 border border-red-400/20">
              <p className="text-sm text-red-200">Error: {error}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={checkHealth}
              disabled={loading}
              className="flex-1 btn-primary py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reintentando...
                </>
              ) : (
                "Reintentar ahora"
              )}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn-secondary py-3 px-4"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Ocultar detalles
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Ver detalles
                </>
              )}
            </button>
          </div>

          {showDetails && health && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 panel-muted rounded-xl p-4 text-xs font-mono text-slate-300 max-h-60 overflow-auto"
            >
              <pre>{JSON.stringify(health, null, 2)}</pre>
            </motion.div>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            La aplicación bloquea el acceso hasta que todos los servicios estén saludables.
            Esto evita errores al operar con datos incompletos.
          </p>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}

function ServiceCheck({ name, status, details }: { name: string; status: "up" | "down" | "checking"; details?: string }) {
  const icons = {
    up: <CheckCircle className="h-5 w-5 text-emerald-300" />,
    down: <AlertCircle className="h-5 w-5 text-rose-300" />,
    checking: <Clock className="h-5 w-5 text-slate-400 animate-spin" />,
  };

  const colors = {
    up: "text-emerald-300",
    down: "text-rose-300",
    checking: "text-slate-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 panel-muted rounded-xl">
      <div className={colors[status]}>{icons[status]}</div>
      <div className="flex-1">
        <p className="font-medium text-white">{name}</p>
        {details && <p className="text-xs text-slate-400 truncate">{details}</p>}
      </div>
      <span className={`text-xs font-medium ${colors[status]}`}>
        {status === "up" ? "OK" : status === "down" ? "FALLA" : "Comprobando..."}
      </span>
    </div>
  );
}

function getServiceName(key: string): string {
  const names: Record<string, string> = {
    database: "Base de datos (PostgreSQL)",
    redis: "Redis (Upstash)",
    "data-collector": "Data Collector (FastAPI)",
  };
  return names[key] || key;
}