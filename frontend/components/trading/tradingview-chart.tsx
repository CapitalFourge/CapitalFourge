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
  // State to track if TradingView script has loaded
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Generate container ID once (pure effect)
  useEffect(() => {
    if (containerIdRef.current === null) {
      containerIdRef.current = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Load TradingView script once
  useEffect(() => {
    // @ts-ignore - Checking for script load on window
    if ((window as any).__TRADINGVIEW_SCRIPT_LOADED) {
      setScriptLoaded(true);
      return;
    }
    // @ts-ignore - Setting flag on window
    (window as any).__TRADINGVIEW_SCRIPT_LOADED = true;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // Script loaded successfully
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setError('Error cargando TradingView script');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    // Cleanup script on unmount? We'll leave it as it's safe to reload.
    return () => {
      // Note: We don't remove the script because it might be used by other instances.
      // If we wanted to be more aggressive, we could remove it, but TradingView
      // might not like that. We'll leave it.
    };
  }, []); // Run once on mount

  // Function to initialize or update the TradingView chart
  useEffect(() => {
    // If script hasn't loaded yet, wait for it
    if (!scriptLoaded) {
      setIsLoading(true);
      setError(null);
      return;
    }

    // If container ref not available, wait
    if (!containerRef.current) {
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
      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div class="p-4 text-center text-red-400">Error inicializando TradingView widget</div>';
        }
      }
    } else {
      // TradingView not ready yet (script may have loaded but widget constructor not available)
      // Keep loading state, but do not set error or modify container
      setIsLoading(true);
      setError(null);
      // Do NOT modify containerRef.current.innerHTML here as it may interfere with widget mounting
    }
  }, [symbol, interval, width, height, scriptLoaded]); // Re-run when these props change or script loads

  // Cleanup widget on unmount
  useEffect(() => {
    return () => {
      if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
        try {
          widgetInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing TradingView widget:', e);
        }
        widgetInstanceRef.current = null;
      }
    };
  }, []);

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