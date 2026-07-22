'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorSelector } from '@/components/trading/indicator-selector';
import { TradingViewChart } from '@/components/trading/tradingview-chart';
import { FundamentalMetricSelector } from '@/components/trading/fundamental-metric-selector';
import { DrawingToolSelector } from '@/components/trading/drawing-tool-selector';
import { FundamentalPricePoint } from '@/lib/types/fundamental-price-point';
import { DrawingTool } from '@/lib/chart-drawing-catalog';
import { useIndicators } from '@/app/(dashboard)/explorer/[symbol]/components/useIndicators';

const ASSET_DATA_QUERY = gql`
  query GetAssetData($symbol: String!) {
    asset(symbol: $symbol) {
      symbol
      name
      category
      description
      website
    }
    priceHistory(symbol: $symbol, days: 365) {
      open
      high
      low
      close
      date
      volume
      marketCap
      trailingPe
      forwardPe
      pegRatio
      priceToBook
      priceToSales
      enterpriseToEbitda
      profitMargins
      operatingMargins
      returnOnEquity
      returnOnAssets
      debtToEquity
      currentRatio
      quickRatio
      dividendYield
      freeCashFlow
      circulatingSupply
      totalSupply
      maxSupply
      inflationRate
      fdv
      activeAddresses
      transactionVolume
      transactionCount
      feesGenerated
      tvl
      hashRate
      stakingRatio
      nakamotoCoefficient
      orderBookDepth
      developerActivity
      userGrowth
      revenue
      priceToFeesRatio
      bitcoinDominance
      fearGreedIndex
      inventoryLevels
      costOfProduction
      allInSustainingCost
      reserveReplacementRatio
      contangoBackwardation
      dollarIndexExposure
      inflationCorrelation
      opecSpareCapacity
      chineseDemandIndex
      weatherIndex
    }
  }
`;

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showFundamental, setShowFundamental] = useState<boolean>(false);
  const [activeFundamentals, setActiveFundamentals] = useState<string[]>([]);
  const [showDrawingTools, setShowDrawingTools] = useState<boolean>(false);
  const [activeDrawingTools, setActiveDrawingTools] = useState<DrawingTool[]>([]);
  const [selectedInterval] = useState<string>('1D');

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = useMemo(() => data?.priceHistory || [], [data?.priceHistory]);
  const latestFundamental = priceHistory[priceHistory.length - 1] as typeof priceHistory[0] | undefined;

  const fullChartData = useMemo(() => {
    return priceHistory
      .map((point: FundamentalPricePoint) => ({
        date: point.date,
        open: point.open || point.close,
        high: point.high || point.close,
        low: point.low || point.close,
        close: point.close,
        volume: point.volume || 0,
      }))
      .filter((point: { date: string; close: number }) => !Number.isNaN(Date.parse(point.date)) && point.close > 0);
  }, [priceHistory]);

  const latestDailyPoint = useMemo(() => fullChartData[fullChartData.length - 1], [fullChartData]);
  const previousDailyPoint = useMemo(() => fullChartData[fullChartData.length - 2], [fullChartData]);

  useIndicators({ priceHistory: priceHistory as FundamentalPricePoint[], activeIndicators });

  if (loading && !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Cargando activo...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-5 text-red-100">
          No fue posible cargar el activo: {error.message}
        </div>
      </div>
    );
  }

  if (!asset) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Activo no encontrado.</div>;
  }

  const latestPrice = latestDailyPoint
    ? `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';

  const change24h = latestDailyPoint && previousDailyPoint
    ? `${(((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100).toFixed(2)}%`
    : '0.00%';

  const volume24h = latestDailyPoint ? latestDailyPoint.volume.toLocaleString(undefined) : '0';
  const marketCap = latestFundamental?.marketCap
      ? `$${latestFundamental.marketCap.toLocaleString(undefined)}`
      : 'N/A';

    return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-black/50">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <Button variant="outline" onClick={() => { window.history.back(); }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al explorador
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="default" className="text-sm px-4 py-2">Comprar</Button>
          <Button variant="destructive" className="text-sm px-4 py-2">Vender</Button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-bold text-white">{asset.symbol}</h1>
              <span className="text-xl font-light text-slate-300">{asset.name}</span>
            </div>
            <span className="text-sm text-slate-400">{asset.category}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Precio actual</p>
              <p className="mt-1 text-xl font-semibold text-white">{latestPrice}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
              <p className="mt-1 text-lg font-semibold {latestDailyPoint && previousDailyPoint && latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400'}">{change24h}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</p>
              <p className="mt-1 text-lg font-semibold text-white">{volume24h}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Market Cap</p>
              <p className="mt-1 text-lg font-semibold text-white">{marketCap}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant={showIndicators ? 'default' : 'outline'}
              onClick={() => setShowIndicators(!showIndicators)}
              className="flex items-center gap-2"
            >
              <IndicatorIcon className="h-4 w-4" />
              Indicadores técnicos ({activeIndicators.length})
            </Button>
            <Button
              variant={showFundamental ? 'default' : 'outline'}
              onClick={() => setShowFundamental(!showFundamental)}
              className="flex items-center gap-2"
            >
              <FundamentalIcon className="h-4 w-4" />
              Fundamentales ({activeFundamentals.length})
            </Button>
            <Button
              variant={showDrawingTools ? 'default' : 'outline'}
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              className="flex items-center gap-2"
            >
              <DrawingIcon className="h-4 w-4" />
              Dibujar ({activeDrawingTools.length})
            </Button>
          </div>

          <TradingViewChart
            symbol={symbol}
            interval={selectedInterval}
            indicators={activeIndicators}
          />

          {showIndicators && (
            <IndicatorSelector
              selectedIndicators={activeIndicators}
              onChange={setActiveIndicators}
            />
          )}

          {showFundamental && (
            <FundamentalMetricSelector
              selectedMetrics={activeFundamentals}
              onChange={setActiveFundamentals}
            />
          )}

          {showDrawingTools && (
            <DrawingToolSelector
              selectedTools={activeDrawingTools}
              onChange={setActiveDrawingTools}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Información del activo</h3>
            {asset.description && (
              <div className="prose prose-invert max-w-none">
                <p>{asset.description}</p>
              </div>
            )}

            {/* Asset Info Cards - Key metrics below description */}
            {latestFundamental && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {latestFundamental.marketCap !== undefined && latestFundamental.marketCap !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Market Cap</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      ${latestFundamental.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
                {latestFundamental.trailingPe !== undefined && latestFundamental.trailingPe !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">P/E (Trailing)</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {latestFundamental.trailingPe.toFixed(2)}
                    </p>
                  </div>
                )}
                {latestFundamental.forwardPe !== undefined && latestFundamental.forwardPe !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">P/E (Forward)</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {latestFundamental.forwardPe.toFixed(2)}
                    </p>
                  </div>
                )}
                {latestFundamental.priceToBook !== undefined && latestFundamental.priceToBook !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Price/Book</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {latestFundamental.priceToBook.toFixed(2)}
                    </p>
                  </div>
                )}
                {latestFundamental.profitMargins !== undefined && latestFundamental.profitMargins !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Profit Margin</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {(latestFundamental.profitMargins * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {latestFundamental.returnOnEquity !== undefined && latestFundamental.returnOnEquity !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">ROE</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {(latestFundamental.returnOnEquity * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {latestFundamental.debtToEquity !== undefined && latestFundamental.debtToEquity !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Debt/Equity</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {latestFundamental.debtToEquity.toFixed(2)}
                    </p>
                  </div>
                )}
                {latestFundamental.dividendYield !== undefined && latestFundamental.dividendYield !== null && (
                  <div className="panel-muted rounded-xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dividend Yield</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {(latestFundamental.dividendYield * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IndicatorIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>;
}

function FundamentalIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8Z" />
  </svg>;
}

function DrawingIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3Z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>;
}