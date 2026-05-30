"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  // Initialize widget
  useEffect(() => {
    // Load script if needed
    if (!(window as any).__TV_LOADED) {
      (window as any).__TV_LOADED = true;
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onerror = () => {
        setError('Error cargando script TradingView');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }

    // Try initialize when both script and container ready
    const tryInit = () => {
      if (!containerRef.current) return;
      
      const tradingView = (window as any).TradingView;
      if (!tradingView?.widget) {
        // Script not ready, wait more
        setTimeout(tryInit, 50);
        return;
      }

      // Clean previous widget
      if (widgetInstanceRef.current?.remove) {
        try { widgetInstanceRef.current.remove(); } catch (e) {}
      }

      // Set container ID
      containerRef.current.id = `tradingview-${symbol}`;
      
      // Clear content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      try {
        const widget = new tradingView.widget({
          container_id: containerRef.current.id,
          width,
          height,
          symbol,
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
        });
        widgetInstanceRef.current = widget;
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
      }
    };

    // Initial attempt
    tryInit();
    
    // Poll for container if not ready
    const interval = setInterval(tryInit, 50);
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (widgetInstanceRef.current?.remove) {
        try { widgetInstanceRef.current.remove(); } catch (e) {}
      }
    };
  }, [symbol, interval, width, height]);

  // Update indicators
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