import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string; // e.g., '1D', '1W', '1M'
  width?: number | string;
  height?: number | string;
}

// Type for the TradingView widget instance (we only use the remove method)
type TradingViewWidgetInstance = {
  remove: () => void;
};

export function TradingViewChart({
  symbol,
  interval = '1D',
  width = '100%',
  height = 400,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to hold the TradingView widget instance
  const widgetInstanceRef = useRef<TradingViewWidgetInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Ref to hold the container ID (initialized once)
  const containerIdRef = useRef<string | null>(null);

  // Generate container ID once (pure effect)
  useEffect(() => {
    if (containerIdRef.current === null) {
      containerIdRef.current = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Function to initialize the TradingView chart
  const initializeChart = () => {
    // Return early if container is not available
    if (!containerRef.current) {
      console.warn('Container ref is not available yet');
      setIsLoading(false);
      return;
    }

    // Ensure container has an ID for TradingView to mount to (do it once)
    if (!containerRef.current.id && containerIdRef.current) {
      containerRef.current.id = containerIdRef.current;
    }

    // Destroy previous instance if exists
    if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
      try {
        widgetInstanceRef.current.remove();
      } catch (e) {
        console.error('Error removing previous TradingView widget:', e);
      }
      widgetInstanceRef.current = null;
    }

    // Check if TradingView is available
    // @ts-ignore - TradingView widget types are not available
    const tradingView = (window as any).TradingView;
    if (tradingView && typeof tradingView.widget === 'function') {
      // Prepare width and height for TradingView options
      // If they're numbers, treat as pixels; if strings, use as-is (for % etc)
      const options = {
        width: width,
        height: height,
        symbol: getTradingViewSymbol(symbol),
        interval: interval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        studies: [], // No studies by default as requested
        container_id: containerRef.current.id, // Critical: tell TradingView where to mount
      };

      try {
        // Initialize widget - it will mount itself to the container_id element
        // @ts-ignore - TradingView widget types are not available
        widgetInstanceRef.current = new (window as any).TradingView.widget(options);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div class="p-4 text-center text-red-400">Error inicializando TradingView widget</div>';
        }
      }
    } else {
      // TradingView not ready yet
      console.warn('TradingView not ready yet');
      setIsLoading(false);
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<div class="p-4 text-center text-yellow-400">Cargando gráfico...</div>';
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Reset state when props change
    setError(null);
    setIsLoading(true);

    // Load TradingView widget script only once
    // @ts-ignore - Checking for script load on window
    if (!((window as any).tvScriptLoaded)) {
      // @ts-ignore - Setting flag on window
      (window as any).tvScriptLoaded = true;

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        // Small delay to ensure the library is fully initialized
        setTimeout(() => {
          if (isMounted) {
            initializeChart();
          }
        }, 500);
      };
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        if (isMounted) {
          setError('Error cargando TradingView widget');
          setIsLoading(false);
        }
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded, just initialize chart
      initializeChart();
    }

    return () => {
      isMounted = false;
      // Cleanup widget on unmount
      if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
        try {
          widgetInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing TradingView widget:', e);
        }
        widgetInstanceRef.current = null;
      }
    };
  }, [symbol, interval, width, height]);

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