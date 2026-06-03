"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  width?: number | string;
  height?: number | string;
  indicators?: string[];
}

function mapSymbolForTradingView(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  
  // Colombian stocks - BVC exchange (Bolsa de Valores de Colombia)
  if (upperSymbol === "EC" || upperSymbol === "ECOPETROL") return "BVC:ECOL";
  if (upperSymbol === "AVAL") return "BVC:AVAL";
  if (upperSymbol === "BANCOLOMBIA" || upperSymbol === "BANCO") return "BVC:BANCOLOMBIA";
  if (upperSymbol === "PF") return "BVC:PF";
  if (upperSymbol === "CEMEX") return "BVC:CEMEXCOL";
  
  // Crypto pairs - TradingView format for price charts
  if (upperSymbol.endsWith("-USD") && !upperSymbol.includes("=")) {
    const base = upperSymbol.replace("-USD", "");
    // Map common symbols to correct TradingView format
    const cryptoMap: Record<string, string> = {
      'DOGE': 'BINANCE:DOGEUSDT',
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'SOL': 'BINANCE:SOLUSDT',
      'ADA': 'BINANCE:ADAUSDT',
      'DOT': 'BINANCE:DOTUSDT',
      'XRP': 'BINANCE:XRPUSDT',
      'MATIC': 'BINANCE:MATICUSDT',
      'AVAX': 'BINANCE:AVAXUSDT',
      'LINK': 'BINANCE:LINKUSDT',
    };
    if (cryptoMap[base]) {
      return cryptoMap[base];
    }
    // Default format for other cryptos
    return `BINANCE:${base}USDT`;
  }
  
  // Forex pairs
  if (upperSymbol.endsWith("=X")) {
    return `FX_IDC:${upperSymbol}`;
  }
  
  // Commodities (TVC prefix for Yahoo Finance commodities)
  if (upperSymbol.endsWith("=F")) {
    return `TVC:${upperSymbol.replace("=F", "")}`;
  }
  
  return upperSymbol;
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
       const tvSymbol = mapSymbolForTradingView(symbol);
       
       widgetInstanceRef.current = new tradingView.widget({
         container_id: containerId,
         width,
         height,
         symbol: tvSymbol,
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
  }, [symbol, interval, width, height, indicators]);

  useEffect(() => {
    if (widgetInstanceRef.current?.setStudies) {
      try {
        widgetInstanceRef.current.setStudies(indicators);
      } catch {}
    }
  }, [indicators]);

  return <div ref={containerRef} style={{ width, height }} />;
}