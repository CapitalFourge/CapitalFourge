"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  width?: number | string;
  height?: number | string;
  indicators?: string[];
}

export function TradingViewChart({
  symbol,
  interval = '1D',
  width = '100%',
  height = 400,
  indicators = [],
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scriptLoadedRef = useRef(false);

  const initializeChart = () => {
    if (!containerRef.current) {
      return false;
    }

    // Clear previous widget content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const tradingView = (window as any).TradingView;
    if (!tradingView || typeof tradingView.widget !== 'function') {
      return false;
    }

    // Generate unique container ID for this symbol to avoid conflicts
    const uniqueId = `tradingview-chart-${symbol}-${Date.now()}`;
    containerRef.current.id = uniqueId;

    const options = {
      width,
      height,
      symbol: getTradingViewSymbol(symbol),
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: indicators,
      container_id: uniqueId,
    };

    try {
      const widget = new (window as any).TradingView.widget(options);
      widgetInstanceRef.current = widget;
      return true;
    } catch (err) {
      console.error('Error initializing TradingView widget:', err);
      return false;
    }
  };

  // Load TradingView script and initialize
  useEffect(() => {
    let cancelled = false;

    const loadScript = (): Promise<void> => {
      return new Promise((resolve) => {
        if ((window as any).TradingView) {
          scriptLoadedRef.current = true;
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (!cancelled) {
            scriptLoadedRef.current = true;
            resolve();
          }
        };
        script.onerror = () => {
          console.error('Failed to load TradingView script');
          if (!cancelled) {
            setError('Error cargando TradingView script');
            setIsLoading(false);
            resolve();
          }
        };
        document.body.appendChild(script);
      });
    };

    // Poll for container to be ready
    const pollInterval = setInterval(() => {
      if (cancelled) {
        clearInterval(pollInterval);
        return;
      }

      if (containerRef.current && scriptLoadedRef.current) {
        if (initializeChart()) {
          setIsLoading(false);
          setError(null);
          clearInterval(pollInterval);
        }
      }
    }, 100);

    loadScript();

    // Timeout
    const timeout = setTimeout(() => {
      if (!cancelled && isLoading) {
        setIsLoading(false);
      }
      clearInterval(pollInterval);
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearTimeout(timeout);
      // Clean up widget on unmount
      if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
        try {
          widgetInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error cleaning up widget:', e);
        }
      }
      widgetInstanceRef.current = null;
    };
  }, []);

  // Re-initialize when symbol changes
  useEffect(() => {
    if (!scriptLoadedRef.current) return;

    // Clean up previous widget
    if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
      try {
        widgetInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error cleaning up widget:', e);
      }
    }

    setIsLoading(true);
    
    // Re-initialize with polling
    const pollInterval = setInterval(() => {
      if (containerRef.current && scriptLoadedRef.current) {
        if (initializeChart()) {
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setIsLoading(false);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [symbol, interval]);

  // Handle indicators changes
  useEffect(() => {
    if (!scriptLoadedRef.current || !widgetInstanceRef.current) return;

    if (typeof widgetInstanceRef.current.setStudies === 'function') {
      try {
        widgetInstanceRef.current.setStudies(indicators);
      } catch (err) {
        console.warn('Failed to update studies:', err);
      }
    }
  }, [indicators]);

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
}

function getTradingViewSymbol(sym: string): string {
  return sym;
}