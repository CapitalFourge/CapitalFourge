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

  const initializeChart = () => {
    if (!containerRef.current) return false;

    // Clear previous content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const tradingView = (window as any).TradingView;
    if (!tradingView || typeof tradingView.widget !== 'function') {
      setIsLoading(true);
      setError(null);
      return false;
    }

    const containerId = `tradingview-chart-${symbol}`;
    containerRef.current.id = containerId;

    const options = {
      width,
      height,
      symbol: symbol,
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
      container_id: containerId,
    };

    try {
      const widget = new (window as any).TradingView.widget(options);
      widgetInstanceRef.current = widget;
      setIsLoading(false);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error initializing TradingView widget:', err);
      setError('Error inicializando TradingView widget');
      setIsLoading(false);
      return false;
    }
  };

  // Load TradingView script once
  useEffect(() => {
    (window as any).__TRADINGVIEW_SCRIPT_LOADED = true;

    if (!(window as any).TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onerror = () => {
        setError('Error cargando TradingView script');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }

    // Poll until container is ready
    const pollInterval = setInterval(() => {
      if (containerRef.current && (window as any).TradingView) {
        if (initializeChart()) {
          clearInterval(pollInterval);
        }
      }
    }, 30);

    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (isLoading) setIsLoading(false);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
      if (widgetInstanceRef.current?.remove) {
        try {
          widgetInstanceRef.current.remove();
        } catch (e) {}
      }
    };
  }, []);

  // Re-initialize when symbol or interval changes
  useEffect(() => {
    if (!(window as any).TradingView) return;

    // Cleanup old widget
    if (widgetInstanceRef.current?.remove) {
      try {
        widgetInstanceRef.current.remove();
      } catch (e) {}
    }
    widgetInstanceRef.current = null;
    setIsLoading(true);

    // Poll until container is ready with dimensions
    const pollInterval = setInterval(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Initialize even with 0 dimensions (widget will handle it)
        if (initializeChart()) {
          clearInterval(pollInterval);
        }
      }
    }, 30);

    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (isLoading) setIsLoading(false);
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [symbol, interval]);

  // Handle indicators
  useEffect(() => {
    if (widgetInstanceRef.current?.setStudies) {
      try {
        widgetInstanceRef.current.setStudies(indicators);
      } catch (err) {}
    }
  }, [indicators]);

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height, minHeight: typeof height === 'number' ? `${height}px` : height }} />;
}