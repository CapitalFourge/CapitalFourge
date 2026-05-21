import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string; // e.g., '1D', '1W', '1M'
  width?: number | string;
  height?: number | string;
}

export function TradingViewChart({ 
  symbol, 
  interval = '1D', 
  width = '100%', 
  height = '100%' 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load TradingView widget script if not already loaded
    if (window.TradingViewWidget) {
      initializeChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        initializeChart();
      };
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup widget on unmount
      if (window.tradingViewWidgetInstance) {
        window.tradingViewWidgetInstance.remove();
        window.tradingViewWidgetInstance = null;
      }
    };
  }, [symbol, interval, width, height]);

  const initializeChart = () => {
    // Destroy previous instance if exists
    if (window.tradingViewWidgetInstance) {
      window.tradingViewWidgetInstance.remove();
    }

    const options = {
      width: width.toString(),
      height: height.toString(),
      symbol: getTradingViewSymbol(symbol),
      interval: interval as any,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: [],
    };

    window.tradingViewWidgetInstance = new window.TradingViewWidget(
      options,
      containerRef.current
    );
  };

  const getTradingViewSymbol = (sym: string): string => {
    // TODO: improve symbol mapping based on asset category/exchange
    // For now, return as is; user may need to adjust
    return sym;
  };

  return <div ref={containerRef} style={{ width, height }} />;
}