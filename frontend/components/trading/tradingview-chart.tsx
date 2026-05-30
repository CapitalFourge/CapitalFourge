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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set container ID based on symbol
    const containerId = `tradingview-chart-${symbol}`;
    container.id = containerId;

    // Clean up previous widget (cleanup from previous render)
    if (widgetInstanceRef.current) {
      try {
        widgetInstanceRef.current.remove();
      } catch {}
      widgetInstanceRef.current = null;
    }

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

    // Initialize widget
    const init = async () => {
      await loadScript();
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
    };

    void init();

    return () => {
      if (widgetInstanceRef.current) {
        try {
          widgetInstanceRef.current.remove();
        } catch {}
        widgetInstanceRef.current = null;
      }
    };
  }, [symbol, interval]);

  useEffect(() => {
    if (widgetInstanceRef.current?.setStudies) {
      try {
        widgetInstanceRef.current.setStudies(indicators);
      } catch {}
    }
  }, [indicators]);

  return <div ref={containerRef} style={{ width, height }} />;
}