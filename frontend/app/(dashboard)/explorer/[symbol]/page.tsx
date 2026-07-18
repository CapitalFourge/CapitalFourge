'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorSelector } from '@/components/trading/indicator-selector';
import { TradingViewChart } from '@/components/trading/tradingview-chart';
import { FundamentalMetricSelector } from '@/components/trading/fundamental-metric-selector';
import { DrawingToolSelector } from '@/components/trading/drawing-tool-selector';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { INDICATOR_CATALOG, IndicatorDefinition } from '@/lib/indicator-catalog';
import { FUNDAMENTAL_METRIC_CATALOG, FundamentalMetricDefinition } from '@/lib/fundamental-metric-catalog';
import { DRAWING_TOOL_CATALOG, DrawingTool } from '@/lib/chart-drawing-catalog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Position {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice?: number;
}

interface FundamentalPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  marketCap?: number | null;
  trailingPe?: number | null;
  forwardPe?: number | null;
  pegRatio?: number | null;
  priceToBook?: number | null;
  priceToSales?: number | null;
  enterpriseToEbitda?: number | null;
  profitMargins?: number | null;
  operatingMargins?: number | null;
  returnOnEquity?: number | null;
  returnOnAssets?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  quickRatio?: number | null;
  dividendYield?: number | null;
  freeCashFlow?: number | null;
  circulatingSupply?: number | null;
  totalSupply?: number | null;
  maxSupply?: number | null;
  inflationRate?: number | null;
  fdv?: number | null;
  activeAddresses?: number | null;
  transactionVolume?: number | null;
  transactionCount?: number | null;
  feesGenerated?: number | null;
  tvl?: number | null;
  hashRate?: number | null;
  stakingRatio?: number | null;
  nakamotoCoefficient?: number | null;
  orderBookDepth?: number | null;
  developerActivity?: number | null;
  userGrowth?: number | null;
  revenue?: number | null;
  priceToFeesRatio?: number | null;
  bitcoinDominance?: number | null;
  fearGreedIndex?: number | null;
  inventoryLevels?: number | null;
  costOfProduction?: number | null;
  allInSustainingCost?: number | null;
  reserveReplacementRatio?: number | null;
  contangoBackwardation?: number | null;
  dollarIndexExposure?: number | null;
  inflationCorrelation?: number | null;
  opecSpareCapacity?: number | null;
  chineseDemandIndex?: number | null;
  weatherIndex?: number | null;
}

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showFundamental, setShowFundamental] = useState<boolean>(false);
  const [activeFundamentals, setActiveFundamentals] = useState<string[]>([]);
  const [showDrawingTools, setShowDrawingTools] = useState<boolean>(false);
  const [activeDrawingTools, setActiveDrawingTools] = useState<DrawingTool[]>([]);

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = data?.priceHistory || [];
  const portfolios = data?.portfolios || [];
  const latestFundamental = priceHistory[priceHistory.length - 1] as typeof priceHistory[0] | undefined;

  const fullChartData = useMemo(() => {
    return priceHistory
      .map((point: any) => ({
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

  const userPosition = useMemo(() => {
    for (const portfolio of portfolios) {
      const position = portfolio.positions.find((p: any) => p.symbol === symbol);
      if (position) {
        return {
          ...position,
          portfolioId: portfolio.id,
          portfolioName: portfolio.name
        };
      }
    }
    return null;
  }, [portfolios, symbol]);

  const indicatorValues = useIndicators({ priceHistory: priceHistory as any, activeIndicators });

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
              <p className="mt-1 text-xl font-semibold text-white">
                {latestDailyPoint ?
                  `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                  '$0.00'}
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
              <p className="mt-1 text-lg font-semibold">
                {latestDailyPoint && previousDailyPoint ? (
                  <span className={latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400'}>
                    {(((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100).toFixed(2)}%
                  </span>
                ) :
                '0.00%'}
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {latestDailyPoint ? latestDailyPoint.volume.toLocaleString(undefined) : '0'}
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Market Cap</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {latestFundamental?.marketCap ?
                  `$${latestFundamental.marketCap.toLocaleString(undefined)}` :
                  'N/A'}
              </p>
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
            data={priceHistory as any}
            indicators={activeIndicators}
            indicatorValues={indicatorValues}
            drawingTools={activeDrawingTools}
            onDrawingToolsChange={setActiveDrawingTools}
          />

          {showIndicators && (
            <IndicatorSelector
              allIndicators={INDICATOR_CATALOG}
              activeIndicators={activeIndicators}
              onChange={setActiveIndicators}
            />
          )}

          {showFundamental && (
            <FundamentalMetricSelector
              allMetrics={FUNDAMENTAL_METRIC_CATALOG}
              activeMetrics={activeFundamentals}
              onChange={setActiveFundamentals}
              latestData={priceHistory[priceHistory.length - 1] as any}
            />
          )}

          {showDrawingTools && (
            <DrawingToolSelector
              allTools={DRAWING_TOOL_CATALOG}
              activeTools={activeDrawingTools}
              onChange={setActiveDrawingTools}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Precio actual"
              value={latestDailyPoint ? `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
            />
            <MetricCard
              label="Cambio 24h"
              value={latestDailyPoint && previousDailyPoint ?
                `${(((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100).toFixed(2)}%` : '0.00%'}
              className={latestDailyPoint && previousDailyPoint && latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400'}
            />
            <MetricCard
              label="Volumen 24h"
              value={latestDailyPoint ? latestDailyPoint.volume.toLocaleString(undefined) : '0'}
            />
            <MetricCard
              label="Market Cap"
              value={latestFundamental?.marketCap ? `$${latestFundamental.marketCap.toLocaleString(undefined)}` : 'N/A'}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Información del activo</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard title="Símbolo" value={asset.symbol} />
              <InfoCard title="Nombre" value={asset.name} />
              <InfoCard title="Categoría" value={asset.category} />
              <InfoCard title="Sitio web" value={asset.website ? <a href={asset.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{asset.website}</a> : 'N/A'} />
            </div>
            {asset.description && (
              <div className="prose prose-invert max-w-none">
                <p>{asset.description}</p>
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

function MetricCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold text-white ${className || ''}`}>{value}</p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
    </div>
  );
}