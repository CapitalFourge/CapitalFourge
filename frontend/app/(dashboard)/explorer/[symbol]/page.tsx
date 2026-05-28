'use client';

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndicatorSelector } from "@/components/trading/indicator-selector";
import { TradingViewChart } from "@/components/trading/tradingview-chart";
import { FundamentalMetricSelector } from "@/components/trading/fundamental-metric-selector";
import { INDICATOR_CATALOG, IndicatorDefinition } from "@/lib/indicator-catalog";
import { FUNDAMENTAL_METRIC_CATALOG, FundamentalMetricDefinition } from "@/lib/fundamental-metric-catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface FundamentalMetricItem {
  id: string;
  label: string;
  description: string;
  value: string;
}

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showFundamental, setShowFundamental] = useState<boolean>(false);
  const [activeFundamentals, setActiveFundamentals] = useState<string[]>([]);

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = data?.priceHistory || [];
  const portfolios = data?.portfolios || [];
  const latestFundamental = priceHistory[priceHistory.length - 1] as FundamentalPricePoint | undefined;

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

  const latestDailyPoint = fullChartData[fullChartData.length - 1];
  const previousDailyPoint = fullChartData[fullChartData.length - 2];

  const userPosition = useMemo(() => {
    for (const portfolio of portfolios) {
      const position = portfolio.positions.find((p: Position) => p.symbol === symbol);
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

  const calculateSMA = (data: FundamentalPricePoint[], period: number = 9): number | null => {
    if (data.length < period) return null;
    const sum = data.slice(-period).reduce((acc, point) => acc + point.close, 0);
    return sum / period;
  };

  const calculateEMA = (data: FundamentalPricePoint[], period: number = 9): number | null => {
    if (data.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((sum, point) => sum + point.close, 0) / period;
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
    }
    
    return ema;
  };

  const calculateRSI = (data: FundamentalPricePoint[], period: number = 14): number | null => {
    if (data.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = data[data.length - i].close - data[data.length - i - 1].close;
      if (change >= 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const change = data[data.length - i].close - data[data.length - i - 1].close;
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const indicatorValues = useMemo(() => {
    const values: Record<string, number | null> = {};
    const closeData = priceHistory.filter((p: FundamentalPricePoint) => typeof p.close === 'number');
    
    activeIndicators.forEach(indicatorId => {
      switch (indicatorId) {
        case 'sma':
          values[indicatorId] = calculateSMA(closeData, 9);
          break;
        case 'ema':
          values[indicatorId] = calculateEMA(closeData, 9);
          break;
        case 'rsi':
          values[indicatorId] = calculateRSI(closeData, 14);
          break;
        case 'wma':
          values[indicatorId] = calculateSMA(closeData, 9);
          break;
        case 'macd':
          values[indicatorId] = null;
          break;
        case 'stochastic':
          values[indicatorId] = null;
          break;
        case 'roc':
          if (closeData.length >= 10) {
            const current = closeData[closeData.length - 1].close;
            const past = closeData[closeData.length - 10].close;
            values[indicatorId] = ((current - past) / past) * 100;
          }
          break;
        case 'bollinger':
          values[indicatorId] = null;
          break;
        case 'obv':
          values[indicatorId] = null;
          break;
        default:
          values[indicatorId] = null;
      }
    });
    
    return values;
  }, [priceHistory, activeIndicators]);

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
        <Button variant="outline" onClick={() => {
          window.history.back();
        }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al explorador
        </Button>
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            className="text-sm px-4 py-2"
          >
            Comprar
          </Button>
          <Button 
            variant="destructive" 
            className="text-sm px-4 py-2"
          >
            Vender
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="mb-8 flex items-baseline gap-4">
          <h1 className="text-4xl font-bold text-white">{asset.symbol}</h1>
          <span className="text-xl font-light text-slate-300">{asset.name}</span>
          <span className="text-sm text-slate-400">{asset.category}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Precio actual</span>
            <span className="text-3xl font-semibold text-white">
              {latestDailyPoint ? 
                `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '$0.00'}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</span>
            <span className="text-xl font-semibold">
              {latestDailyPoint && previousDailyPoint ? 
                (
                  <span className={latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400'}>
                    {(((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100).toFixed(2)}%
                  </span>
                ) : 
                '0.00%'}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</span>
            <span className="text-xl font-semibold text-white">
              {latestDailyPoint ? 
                latestDailyPoint.volume.toLocaleString(undefined) : 
                '0'}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Posición</span>
            {userPosition ? (
              <span className="text-xl font-semibold text-white">
                {userPosition.quantity} en {userPosition.portfolioName}
              </span>
            ) : (
              <span className="text-xl font-semibold text-white">0</span>
            )}
          </div>
        </div>

        <div className="mb-8">
          <TradingViewChart
            symbol={symbol}
            interval="1D"
            width="100%"
            height={600}
            indicators={activeIndicators}
          />
        </div>

        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-8">
          <Button 
            variant={showIndicators ? "default" : "outline"}
            onClick={() => setShowIndicators(!showIndicators)}
            className="text-sm px-4 py-2"
          >
            Indicadores {activeIndicators.length > 0 && `(${activeIndicators.length})`}
          </Button>
          <Button 
            variant={showFundamental ? "default" : "outline"}
            onClick={() => setShowFundamental(!showFundamental)}
            className="text-sm px-4 py-2"
          >
            Análisis Fundamental {activeFundamentals.length > 0 && `(${activeFundamentals.length})`}
          </Button>
        </div>

        {showIndicators && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Indicadores técnicos</h2>
            <IndicatorSelector 
              selectedIndicators={activeIndicators} 
              onChange={setActiveIndicators} 
            />
          </div>
        )}

        {activeIndicators.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Indicadores calculados</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {INDICATOR_CATALOG.filter((i: IndicatorDefinition) => activeIndicators.includes(i.id)).map((indicator: IndicatorDefinition) => {
                const value = indicatorValues[indicator.id];
                const displayValue = value !== null && value !== undefined 
                  ? (indicator.id === 'rsi' ? `${value.toFixed(2)}` : `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
                  : "-";
                
                return (
                  <Card key={indicator.id} className="border-white/10 bg-slate-950/45">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {indicator.label}: <span className="text-emerald-400">{displayValue}</span>
                        <button
                          type="button"
                          onClick={() => setActiveIndicators(activeIndicators.filter(id => id !== indicator.id))}
                          className="rounded-full text-slate-400 transition hover:text-white"
                          aria-label={`Quitar ${indicator.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-400 text-xs">{indicator.shortDescription}</CardDescription>
                      <p className="mt-2 text-xs text-emerald-400/70">{indicator.usage}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {showFundamental && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Análisis fundamental</h2>
            <FundamentalMetricSelector
              selectedMetrics={activeFundamentals}
              onChange={setActiveFundamentals}
              assetCategory={asset?.category}
            />
          </div>
        )}

        {activeFundamentals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Métricas fundamentales seleccionadas</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {FUNDAMENTAL_METRIC_CATALOG.filter((m: FundamentalMetricDefinition) => activeFundamentals.includes(m.id)).map((metric: FundamentalMetricDefinition) => {
                const rawValue = latestFundamental?.[metric.id as keyof FundamentalPricePoint];
                let displayValue = "-";
                
                if (rawValue !== undefined && rawValue !== null && rawValue !== 0) {
                  if (metric.formatter === "percent") {
                    displayValue = `${(rawValue * 100).toFixed(2)}%`;
                  } else if (metric.formatter === "currency") {
                    displayValue = `$${rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                  } else {
                    displayValue = rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
                  }
                }
                
                return (
                  <Card key={metric.id} className="border-white/10 bg-slate-950/45">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {metric.label}
                        <button
                          type="button"
                          onClick={() => setActiveFundamentals(activeFundamentals.filter(id => id !== metric.id))}
                          className="rounded-full text-slate-400 transition hover:text-white"
                          aria-label={`Quitar ${metric.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-semibold text-emerald-400">{displayValue}</p>
                      <CardDescription className="mt-1 text-slate-400">{metric.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}