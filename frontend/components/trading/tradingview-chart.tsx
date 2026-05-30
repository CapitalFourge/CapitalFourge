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
  const initializedRef = useRef(false);

  // Load TradingView script
  useEffect(() => {
    let cancelled = false;
    initializedRef.current = false;

    const tryInitialize = () => {
      if (!containerRef.current) return;

      const tradingView = (window as any).TradingView;
      if (!tradingView || typeof tradingView.widget !== 'function') return;

      // Clean previous content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      const containerId = `tradingview-chart-${symbol}-${Date.now()}`;
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
        initializedRef.current = true;
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

    // Check if already loaded
    if ((window as any).TradingView) {
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        if (tryInitialize()) {
          clearInterval(interval);
        }
      }, 50);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    // Load script
    (window as any).__TRADINGVIEW_SCRIPT_LOADED = true;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (cancelled) return;
      const interval = setInterval(() => {
        if (tryInitialize()) {
          clearInterval(interval);
        }
      }, 50);
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      if (!cancelled) {
        setError('Error cargando TradingView script');
        setIsLoading(false);
      }
    };
    document.body.appendChild(script);

    // Timeout
    const timeout = setTimeout(() => {
      if (!cancelled && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      // Clean up widget
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

  // Re-initialize when symbol or interval changes
  useEffect(() => {
    if (!(window as any).TradingView) return;

    // Clean up previous widget
    if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
      try {
        widgetInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error cleaning up widget:', e);
      }
    }
    widgetInstanceRef.current = null;

    setIsLoading(true);
    
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 5000);

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }
      if (containerRef.current) {
        // Clean previous content
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        const containerId = `tradingview-chart-${symbol}-${Date.now()}`;
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
          clearInterval(interval);
        } catch (err) {
          console.error('Error re-initializing widget:', err);
        }
      }
    }, 50);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [symbol, interval]);

  // Handle indicators changes
  useEffect(() => {
    if (!widgetInstanceRef.current) return;

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

  return <div ref={containerRef} style={{ width, height, minHeight: typeof height === 'number' ? `${height}px` : height }} />;
}