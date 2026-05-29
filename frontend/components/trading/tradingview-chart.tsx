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
  const containerIdRef = useRef<string | null>(null);

  // Generate container ID once
  useEffect(() => {
    if (containerIdRef.current === null) {
      containerIdRef.current = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  const initializeChart = () => {
    if (!containerRef.current) {
      setIsLoading(false);
      return;
    }

    if (containerRef.current && !containerRef.current.id && containerIdRef.current) {
      containerRef.current.id = containerIdRef.current;
    }

    const tradingView = (window as any).TradingView;
    if (!tradingView || typeof tradingView.widget !== 'function') {
      setIsLoading(true);
      setError(null);
      return;
    }

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
      container_id: containerRef.current.id,
    };

    try {
      const widget = new (window as any).TradingView.widget(options);
      widgetInstanceRef.current = widget;
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error initializing TradingView widget:', err);
      setError('Error inicializando TradingView widget');
      setIsLoading(false);
      widgetInstanceRef.current = null;
    }
  };

  // Load TradingView script only once
  useEffect(() => {
    if ((window as any).__TRADINGVIEW_SCRIPT_LOADED) {
      scriptLoadedRef.current = true;
      initializeChart();
      return;
    }

    (window as any).__TRADINGVIEW_SCRIPT_LOADED = true;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializeChart();
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setError('Error cargando TradingView script');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      widgetInstanceRef.current = null;
    };
  }, []);

  // Re-run when props change (except indicators)
  useEffect(() => {
    if (!scriptLoadedRef.current) {
      setIsLoading(true);
      setError(null);
      return;
    }

    if (!containerRef.current) return;

    initializeChart();
  }, [symbol, interval, width, height]);

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