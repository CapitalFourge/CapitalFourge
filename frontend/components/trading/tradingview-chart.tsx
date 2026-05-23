'use client';

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string; // e.g., '1D', '1W', '1M'
  width?: number | string;
  height?: number | string;
  indicators?: string[]; // New prop for selected indicator IDs
}

export function TradingViewChart({
  symbol,
  interval = '1D',
  width = '100%',
  height = 400,
  indicators = [],
}: TradingViewChartProps) {
  console.log('[TradingViewChart] Component function called with symbol:', symbol);

  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to hold the TradingView widget instance
  const widgetInstanceRef = useRef<any | null>(null); // TradingView widget type is not available in types
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
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
    if (containerRef.current && !containerRef.current.id && containerIdRef.current) {
      containerRef.current.id = containerIdRef.current;
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
        studies: indicators, // Use the indicators prop
        container_id: containerRef.current.id, // Critical: tell TradingView where to mount
      };

      try {
        // If we already have a widget, try to update its studies instead of recreating
        // This avoids DOM removal issues
        if (widgetInstanceRef.current && typeof widgetInstanceRef.current.setStudies === 'function') {
          try {
            widgetInstanceRef.current.setStudies(indicators);
            setIsLoading(false);
            setError(null);
            return;
          } catch (setStudiesErr) {
            console.warn('Failed to update studies via setStudies, recreating widget:', setStudiesErr);
            // Fall through to recreate widget
          }
        }

        // IMPORTANT: Do NOT try to remove the previous widget here.
        // TradingView will handle cleaning up the previous widget when we
        // create a new one with the same container_id (or a new container_id).
        // Manual removal causes DOM errors because TradingView manages its own elements.

        // Initialize widget - it will mount itself to the container_id element
        // @ts-ignore - TradingView widget types are not available
        const widget = new (window as any).TradingView.widget(options);
        widgetInstanceRef.current = widget;
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        setError('Error inicializando TradingView widget');
        setIsLoading(false);
        // Clear the widget instance on error to prevent stale references
        widgetInstanceRef.current = null;
      }
    } else {
      // TradingView not ready yet (script may have loaded but widget constructor not available)
      // Keep loading state, but do not set error
      setIsLoading(true);
      setError(null);
    }
  };

  // Load TradingView script only once
  useEffect(() => {
    // @ts-ignore - Checking for script load on window
    if ((window as any).__TRADINGVIEW_SCRIPT_LOADED) {
      // Script already loaded, we can try to initialize
      setScriptLoaded(true);
      initializeChart();
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
      // Initialize chart after script load
      initializeChart();
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setError('Error cargando TradingView script');
      setIsLoading(false);
      setScriptLoaded(false);
    };
    document.body.appendChild(script);

    // Cleanup script on unmount? We'll leave it as it's safe to reload.
    return () => {
      // Note: We don't remove the script because it might be used by other instances.
      // If we wanted to be more aggressive, we could remove it, but TradingView
      // might not like that. We'll leave it.
    };
  }, []); // Run once on mount

  // Re-run initialization when props change (except indicators, which we handle separately)
  useEffect(() => {
    // If script hasn't loaded yet, wait for it
    if (!(window as any).__TRADINGVIEW_SCRIPT_LOADED) {
      setIsLoading(true);
      setError(null);
      setScriptLoaded(false);
      return;
    }

    // If container ref not available, wait
    if (!containerRef.current) {
      return;
    }

    // Initialize chart (this will handle indicators via setStudies if widget exists)
    initializeChart();
  }, [symbol, interval, width, height]); // Re-run when these props change (not indicators)

  // Handle indicators changes separately to update studies without recreating widget
  useEffect(() => {
    // If script hasn't loaded or widget not initialized, do nothing (will be handled by other effects)
    if (!(window as any).__TRADINGVIEW_SCRIPT_LOADED || !widgetInstanceRef.current) {
      return;
    }
    // Try to update studies if the widget supports it
    if (typeof widgetInstanceRef.current.setStudies === 'function') {
      try {
        widgetInstanceRef.current.setStudies(indicators);
      } catch (err) {
        console.warn('Failed to update studies via setStudies:', err);
        // If updating fails, we could trigger a full reinitialize, but let's not for now
        // Instead, we rely on the other effect to reinitialize when symbols/interval/etc change
      }
    } else {
      // If widget doesn't support setStudies, we need to reinitialize the whole widget
      // This will cause a recreate, but hopefully the widget supports setStudies
      initializeChart();
    }
  }, [indicators]); // Re-run when indicators change

  // Cleanup widget on unmount - clear the reference
  // We do not call remove() on the widget as it can cause DOM errors if the widget
  // has already cleaned up its own elements. Instead, we let React remove the container
  // and its children when the component unmounts.
  useEffect(() => {
    return () => {
      widgetInstanceRef.current = null;
    };
  }, []); // Empty deps - runs only on unmount

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-yellow-400">Cargando gráfico...</div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
}

// Helper function to map symbol to TradingView format (if needed)
function getTradingViewSymbol(sym: string): string {
  // TODO: improve symbol mapping based on asset category/exchange
  // For now, return as is; user may need to adjust
  return sym;
}