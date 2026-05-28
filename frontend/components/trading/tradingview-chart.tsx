import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  width?: number | string;
  height?: number | string;
  indicators?: string[]; // Our indicator IDs (sma, ema, rsi, etc)
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
  const chartRef = useRef<any | null>(null);
  const appliedStudiesRef = useRef<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerIdRef = useRef<string | null>(null);

  // Generate container ID once (pure effect)
  useEffect(() => {
    if (containerIdRef.current === null) {
      containerIdRef.current = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  const applyStudies = (chart: any, indicatorIds: string[]) => {
    // Clear previous studies that we applied
    appliedStudiesRef.current.forEach(studyId => {
      try {
        chart.removeStudy(studyId);
      } catch (e) {
        console.warn('Could not remove study:', e);
      }
    });
    appliedStudiesRef.current = [];

    // Apply new studies
    const studies = mapIndicatorsToStudies(indicatorIds);
    studies.forEach(study => {
      try {
        const studyId = chart.addStudy(study.id, study.inputs || {});
        appliedStudiesRef.current.push(studyId);
      } catch (e) {
        console.warn('Could not add study:', e);
      }
    });
  };

  const initializeChart = () => {
    if (!containerRef.current) {
      setIsLoading(false);
      return;
    }

    if (containerRef.current && !containerRef.current.id && containerIdRef.current) {
      containerRef.current.id = containerIdRef.current;
    }

    // Clean up previous widget if exists
    if (widgetInstanceRef.current) {
      try {
        if ((widgetInstanceRef.current as any).remove) {
          (widgetInstanceRef.current as any).remove();
        }
      } catch (e) {
        console.warn('Error removing widget:', e);
      }
      widgetInstanceRef.current = null;
      chartRef.current = null;
      
      // Clear the container content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // @ts-ignore - TradingView widget types are not available
    const tradingView = (window as any).TradingView;
    if (tradingView && typeof tradingView.widget === 'function') {
      const options = {
        width,
        height,
        symbol: getTradingViewSymbol(symbol),
        interval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      };

      try {
        const widget = new (window as any).TradingView.widget(options);
        widgetInstanceRef.current = widget;
        
        // Apply studies when chart is ready
        widget.onChartReady && widget.onChartReady(() => {
          chartRef.current = widget.activeChart();
          applyStudies(chartRef.current, indicators);
        });
        
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
        widgetInstanceRef.current = null;
      }
    }
  };

  useEffect(() => {
    if ((window as any).__TRADINGVIEW_SCRIPT_LOADED) {
      initializeChart();
      return;
    }
    (window as any).__TRADINGVIEW_SCRIPT_LOADED = true;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initializeChart;
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setError('Error cargando TradingView script');
      setIsLoading(false);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!(window as any).__TRADINGVIEW_SCRIPT_LOADED) return;
    if (!containerRef.current) return;
    initializeChart();
  }, [symbol, interval, width, height]);

  // Apply indicators without reloading the widget
  useEffect(() => {
    if (!(window as any).__TRADINGVIEW_SCRIPT_LOADED || !chartRef.current) return;
    applyStudies(chartRef.current, indicators);
  }, [indicators]);

  useEffect(() => {
    return () => {
      if (widgetInstanceRef.current) {
        try {
          if ((widgetInstanceRef.current as any).remove) {
            (widgetInstanceRef.current as any).remove();
          }
        } catch (e) {
          console.warn('Error cleaning up widget:', e);
        }
        widgetInstanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
}

// Helper function to map our indicator IDs to TradingView study format
function mapIndicatorsToStudies(indicatorIds: string[]): any[] {
  const studyMap: Record<string, { id: string; inputs?: Record<string, unknown> }> = {
    sma: { id: 'SMA', inputs: { length: 9, source: 'close' } },
    ema: { id: 'EMA', inputs: { length: 9, source: 'close' } },
    wma: { id: 'WMA', inputs: { length: 9 } },
    rsi: { id: 'RSI', inputs: { length: 14 } },
    macd: { id: 'MACD', inputs: { fastLength: 12, slowLength: 26, signalLength: 9 } },
    stochastic: { id: 'Stoch', inputs: { k: 14, d: 3 } },
    roc: { id: 'ROC', inputs: { length: 10 } },
    bollinger: { id: 'BB', inputs: { length: 20, stdDev: 2 } },
    obv: { id: 'OBV' },
  };

  return indicatorIds
    .filter(id => studyMap[id])
    .slice(0, 6)
    .map(id => studyMap[id]);
}

// Helper function to map symbol to TradingView format
function getTradingViewSymbol(sym: string): string {
  return sym;
}