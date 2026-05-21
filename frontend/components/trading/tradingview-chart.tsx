import { useEffect, useRef, useState } from 'react';

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
  height = 400 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Reset state when props change
    setError(null);
    setIsLoading(true);
    
    // Load TradingView widget script only once
    if (!((window as any).tvScriptLoaded)) {
      (window as any).tvScriptLoaded = true;
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        // Small delay to ensure the library is fully initialized
        setTimeout(() => {
          initializeChart();
        }, 500);
      };
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        setError('Error cargando TradingView widget');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded, just initialize chart
      initializeChart();
    }

    return () => {
      // Cleanup widget on unmount
      if ((window as any).tradingViewWidgetInstance) {
        (window as any).tradingViewWidgetInstance.remove();
        (window as any).tradingViewWidgetInstance = null;
      }
    };
  }, [symbol, interval, width, height]);

  const initializeChart = () => {
    // Return early if container is not available
    if (!containerRef.current) {
      console.warn('Container ref is not available yet');
      setIsLoading(false);
      return;
    }

    // Destroy previous instance if exists
    if ((window as any).tradingViewWidgetInstance) {
      (window as any).tradingViewWidgetInstance.remove();
      (window as any).tradingViewWidgetInstance = null;
    }

    // Check if TradingView is available
    if (window.TradingView && typeof window.TradingView.widget === 'function') {
      // Ensure container has an ID for TradingView to mount to
      if (!containerRef.current.id) {
        containerRef.current.id = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Prepare width and height for TradingView options
      // If they're numbers, treat as pixels; if strings, use as-is (for % etc)
      const widgetWidth = typeof width === 'number' ? width : width;
      const widgetHeight = typeof height === 'number' ? height : height;

      const options = {
        width: widgetWidth,
        height: widgetHeight,
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
        studies: [], // No studies by default as requested
        container_id: containerRef.current.id // Critical: tell TradingView where to mount
      };

      try {
        // Initialize widget - it will mount itself to the container_id element
        (window as any).tradingViewWidgetInstance = new window.TradingView.widget(options);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="p-4 text-center text-red-400">Error inicializando TradingView widget</div>';
        }
      }
    } else {
      // TradingView not ready yet
      console.warn('TradingView not ready yet');
      setIsLoading(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div class="p-4 text-center text-yellow-400">Cargando gráfico...</div>';
      }
    }
  };

  const getTradingViewSymbol = (sym: string): string => {
    // TODO: improve symbol mapping based on asset category/exchange
    // For now, return as is; user may need to adjust
    return sym;
  };

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
}