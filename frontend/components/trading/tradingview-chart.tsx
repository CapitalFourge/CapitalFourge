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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous widget
    if (widgetInstanceRef.current) {
      try {
        widgetInstanceRef.current.remove();
      } catch {}
      widgetInstanceRef.current = null;
    }

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const containerId = `tradingview-chart-${symbol}`;
    container.id = containerId;

    // Load TradingView script if needed
    const loadScript = (): Promise<void> => {
      return new Promise((resolve) => {
        if ((window as any).__TV_LOADED && (window as any).TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          (window as any).__TV_LOADED = true;
          resolve();
        };
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      await loadScript();
      if (cancelled) return;
      
      const tradingView = (window as any).TradingView;
      
      widgetInstanceRef.current = new tradingView.widget({
        container_id: containerId,
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
      if (!cancelled) setLoading(false);
    };

    void init();

    return () => {
      cancelled = true;
      if (widgetInstanceRef.current) {
        try {
          widgetInstanceRef.current.remove();
        } catch {}
        widgetInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval]);

  return (
    <div ref={containerRef} style={{ width, height, minHeight: typeof height === 'number' ? `${height}px` : height, position: 'relative' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-yellow-400">Cargando gráfico...</span>
        </div>
      )}
    </div>
  );
}