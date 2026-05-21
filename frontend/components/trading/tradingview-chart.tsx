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
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Load TradingView widget script only once
    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      
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
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="p-4 text-center text-red-400">Error cargando TradingView widget</div>';
        }
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded, just initialize chart
      initializeChart();
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
    // Return early if container is not available
    if (!containerRef.current) {
      console.warn('Container ref is not available yet');
      return;
    }

    // Destroy previous instance if exists
    if (window.tradingViewWidgetInstance) {
      window.tradingViewWidgetInstance.remove();
      window.tradingViewWidgetInstance = null;
    }

    // Check if TradingView is available
    if (window.TradingView && typeof window.TradingView.widget === 'function') {
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

      try {
        window.tradingViewWidgetInstance = new window.TradingView.widget(
          options,
          containerRef.current
        );
        widgetInitializedRef.current = true;
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="p-4 text-center text-red-400">Error inicializando TradingView widget</div>';
        }
      }
    } else {
      // TradingView not ready yet
      console.warn('TradingView not ready yet');
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

  return <div ref={containerRef} style={{ width, height }} />;
}