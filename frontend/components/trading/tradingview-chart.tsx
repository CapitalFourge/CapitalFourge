import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface TradingViewWidget {
  remove?: () => void;
  onChartReady?: (callback: () => void) => void;
  activeChart?: () => TradingViewChart;
}

interface TradingViewChart {
  removeStudy?: (studyId: string) => void;
  addStudy?: (studyId: string, inputs?: Record<string, unknown>) => string;
}

type WidgetStudyMap = Record<string, { id: string; inputs?: Record<string, unknown> }>;

interface TradingViewGlobal extends Window {
  TradingView?: {
    widget: new (options: WidgetOptions) => TradingViewWidget;
  };
  __TRADINGVIEW_SCRIPT_LOADED?: boolean;
}

interface WidgetOptions {
  width: string | number;
  height: string | number;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  hide_side_toolbar: boolean;
  allow_symbol_change: boolean;
}

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
  const widgetInstanceRef = useRef<TradingViewWidget | null>(null);
  const chartRef = useRef<TradingViewChart | null>(null);
  const appliedStudiesRef = useRef<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const safeSetState = useMemo(() => ({
    setError: (msg: string) => {
      if (mountedRef.current) setError(msg);
    },
    setIsLoading: (loading: boolean) => {
      if (mountedRef.current) setIsLoading(loading);
    },
  }), []);

  useEffect(() => {
    if (containerIdRef.current === null) {
      containerIdRef.current = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyStudies = useCallback((chart: TradingViewChart, indicatorIds: string[]) => {
    appliedStudiesRef.current.forEach(studyId => {
      try {
        chart.removeStudy?.(studyId);
      } catch (e) {
        console.warn('Could not remove study:', e);
      }
    });
    appliedStudiesRef.current = [];

    const studies = mapIndicatorsToStudies(indicatorIds);
    studies.forEach(study => {
      try {
        const studyId = chart.addStudy?.(study.id, study.inputs);
        if (studyId) {
          appliedStudiesRef.current.push(studyId);
        }
      } catch (e) {
        console.warn('Could not add study:', e);
      }
    });
  }, []);

  const createWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      safeSetState.setIsLoading(false);
      return;
    }

    if (container && !container.id && containerIdRef.current) {
      container.id = containerIdRef.current;
    }

    if (widgetInstanceRef.current) {
      try {
        if (widgetInstanceRef.current.remove) {
          widgetInstanceRef.current.remove();
        }
      } catch (e) {
        console.warn('Error removing widget:', e);
      }
      widgetInstanceRef.current = null;
      chartRef.current = null;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    const windowWithTV = window as unknown as TradingViewGlobal;
    if (windowWithTV.TradingView && typeof windowWithTV.TradingView.widget === 'function') {
      const options: WidgetOptions = {
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
        const widget = new windowWithTV.TradingView.widget(options);
        widgetInstanceRef.current = widget;

        widget.onChartReady?.(() => {
          chartRef.current = widget.activeChart
            ? widget.activeChart()
            : null;
          if (chartRef.current) {
            applyStudies(chartRef.current, indicators);
          }
        });

        safeSetState.setIsLoading(false);
        safeSetState.setError(null);
      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        safeSetState.setError('Error inicializando TradingView widget');
        safeSetState.setIsLoading(false);
        widgetInstanceRef.current = null;
      }
    }
  }, [symbol, interval, width, height, indicators, applyStudies, safeSetState]);

  useEffect(() => {
    const windowWithTV = window as unknown as TradingViewGlobal;
    if (windowWithTV.__TRADINGVIEW_SCRIPT_LOADED) {
      createWidget();
      return;
    }
    windowWithTV.__TRADINGVIEW_SCRIPT_LOADED = true;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = createWidget;
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      safeSetState.setError('Error cargando TradingView script');
      safeSetState.setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (widgetInstanceRef.current) {
        try {
          if (widgetInstanceRef.current.remove) {
            widgetInstanceRef.current.remove();
          }
        } catch (e) {
          console.warn('Error cleaning up widget:', e);
        }
        widgetInstanceRef.current = null;
      }
    };
  }, [createWidget, safeSetState]);

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
}

function mapIndicatorsToStudies(indicatorIds: string[]): WidgetStudyMap[] {
  const studyMap: WidgetStudyMap = {
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

function getTradingViewSymbol(sym: string): string {
  return sym;
}