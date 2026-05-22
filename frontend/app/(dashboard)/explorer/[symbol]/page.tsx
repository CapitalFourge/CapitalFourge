'use client';

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndicatorSelector } from "@/components/trading/indicator-selector";
import { TradingViewChart } from "@/components/trading/tradingview-chart";
import { LiquidityHeatmap } from "@/components/trading/liquidity-heatmap";
import { FUNDAMENTAL_METRIC_CATALOG, FundamentalCategory, FundamentalMetricDefinition } from "@/lib/fundamental-metric-catalog";

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

interface FundamentalMetricSection {
  section: string;
  summary: string;
  metrics: FundamentalMetricItem[];
}

type ChartType = "area" | "line" | "candles";
type CandleTimeframe = "1D" | "1W" | "1M";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function aggregateCandles<
  T extends { date: string; open: number; high: number; low: number; close: number; volume: number }
>(points: T[], timeframe: CandleTimeframe): T[] {
  if (timeframe === "1D" || points.length <= 1) {
    return points;
  }

  const grouped = new Map<string, T[]>();

  for (const point of points) {
    const date = new Date(point.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const key =
      timeframe === "1W"
        ? startOfWeek(date).toISOString().slice(0, 10)
        : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

    const current = grouped.get(key) ?? [];
    current.push(point);
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map((bucket) => {
    const sorted = [...bucket].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      ...last,
      date: last.date,
      open: first.open,
      high: Math.max(...sorted.map((point) => point.high)),
      low: Math.min(...sorted.map((point) => point.low)),
      close: last.close,
      volume: sorted.reduce((sum, point) => sum + point.volume, 0),
    };
  });
}

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'buy' | 'sell'>('buy');
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showFundamental, setShowFundamental] = useState<boolean>(false);

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = data?.priceHistory || [];
  const portfolios = data?.portfolios || [];
  const latestFundamental = priceHistory[priceHistory.length - 1] as FundamentalPricePoint | undefined;

  // Process price history for stats and fundamentals
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

  // Find user's position in this asset
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

  const fundamentalMetrics = useMemo<FundamentalMetricSection[]>(() => {
    if (!latestFundamental) {
      return [];
    }

    const category: FundamentalCategory =
      asset?.category === "CRYPTO" ? "CRYPTO" : asset?.category === "COMMODITIES" ? "COMMODITIES" : "STOCKS";

    const sectionSummaries: Record<string, string> = {
      Actividad: "Contexto base de tamano, liquidez y traccion del activo.",
      Valoracion: "Multiples para juzgar cuanto esta pagando el mercado por el activo.",
      Rentabilidad: "Metricas para entender eficiencia y capacidad de generar retorno.",
      Solidez: "Senales de balance y liquidez para evaluar resiliencia financiera.",
      "Retorno al accionista": "Variables ligadas a caja libre y distribucion de valor.",
      Tokenomics: "Variables de oferta que condicionan dilucion, escasez y valor relativo.",
      "On-chain": "Uso economico de la red y actividad registrada en la cadena.",
      "Seguridad de red": "Metricas que ayudan a entender robustez y descentralizacion.",
      Mercado: "Lecturas de liquidez, sentimiento y traccion del ecosistema.",
      "Oferta y demanda": "Factores fisicos o estructurales que tensionan el equilibrio del commodity.",
      "Curva y macro": "Variables macro y de futuros que suelen mover la narrativa del activo.",
    };

    const formatMetricValue = (definition: FundamentalMetricDefinition, rawValue?: number | null) => {
      if (rawValue === undefined || rawValue === null || rawValue === 0) {
        return null;
      }

      if (definition.formatter === "percent") {
        return `${(rawValue * 100).toFixed(2)}%`;
      }

      if (definition.formatter === "currency") {
        return `$${rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      }

      return rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const grouped = FUNDAMENTAL_METRIC_CATALOG.reduce<Map<string, FundamentalMetricItem[]>>((acc, definition) => {
      if (!definition.categories.includes(category)) {
        return acc;
      }

      const rawValue = latestFundamental[definition.id as keyof FundamentalPricePoint];
      if (typeof rawValue !== "number" && rawValue !== null && rawValue !== undefined) {
        return acc;
      }

      const value = formatMetricValue(definition, rawValue);
      if (!value) {
        return acc;
      }

      const current = acc.get(definition.section) ?? [];
      current.push({
        id: definition.id,
        label: definition.label,
        description: definition.description,
        value,
      });
      acc.set(definition.section, current);
      return acc;
    }, new Map<string, FundamentalMetricItem[]>());

    return Array.from(grouped.entries()).map(([section, metrics]) => ({
      section,
      summary: sectionSummaries[section] ?? "Lectura complementaria para entender mejor el estado del activo.",
      metrics,
    }));
  }, [asset?.category, latestFundamental]);

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (data: FundamentalPricePoint[], period: number): number | null => {
    if (data.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((sum, point) => sum + point.close, 0) / period; // SMA for first EMA
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
    }
    
    return ema;
  };

  // Calculate RSI (Relative Strength Index)
  const calculateRSI = (data: FundamentalPricePoint[], period: number): number | null => {
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
          // Go back to explorer
          window.history.back();
        }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al explorador
        </Button>
        <div className="flex items-center gap-4">           <Button 
             variant="default" 
             onClick={() => {
               setDialogType('buy');
               setIsDialogOpen(true);
             }}
             className="text-sm px-4 py-2"
           >
             Comprar
           </Button>
           <Button 
             variant="destructive" 
             onClick={() => {
               setDialogType('sell');
               setIsDialogOpen(true);
             }}
             className="text-sm px-4 py-2 ml-2"
           >
             Vender
           </Button></div>
      </div>

      <div className="p-6">
        {/* Asset Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">{asset.symbol}</h1>
          <p className="mt-2 text-xl font-light text-slate-300">{asset.name}</p>
          <p className="mt-1 text-sm text-slate-400">{asset.category}</p>
        </div>

        {/* Asset Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Precio actual</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {latestDailyPoint ? 
                `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '$0.00'}
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
            <p className="mt-2 text-2xl font-semibold">
              {latestDailyPoint && previousDailyPoint ? 
                (
                  ((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100
                ).toFixed(2) + '%' : 
                '0.00%'}
              <span className={(latestDailyPoint && previousDailyPoint) ? (latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400') : undefined}>
              </span>
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {latestDailyPoint ? 
                latestDailyPoint.volume.toLocaleString(undefined) : 
                '0'}
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Posición</p>
            {userPosition ? (
              <>
                <p className="mt-2 text-xl font-semibold text-white">
                  {userPosition.quantity}
                </p>
                <p className="text-sm text-slate-400">
                  En {userPosition.portfolioName}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xl font-semibold text-white">0</p>
            )}
          </div>
        </div>

        {/* Price Chart */}
        <div className="mb-8">
          <TradingViewChart
            symbol={symbol}
            interval="1D"
            width="100%"
            height={750}
          />
<div className="flex items-center justify-between p-6 border-b border-white/10">
  <div className="flex items-center gap-4">
           <Button 
             variant="outline" 
             onClick={() => setShowIndicators(!showIndicators)}
             className="text-sm px-4 py-2"
           >
             Indicadores {showIndicators ? '▲' : '▼'}
           </Button>
           <Button 
             variant="outline" 
             onClick={() => setShowFundamental(!showFundamental)}
             className="text-sm px-4 py-2"
           >
             Análisis Fundamental {showFundamental ? '▲' : '▼'}
           </Button>
  </div>
</div>
        </div>

        {/* Indicators */}
        {showIndicators && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Indicadores</h2>
            <IndicatorSelector selectedIndicators={activeIndicators} onChange={setActiveIndicators} />
          </div>
        )}

        {/* Análisis Fundamental */}
        {showFundamental && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Análisis fundamental</h2>
            {fundamentalMetrics.length > 0 ? (
              <div className="space-y-5">
                {fundamentalMetrics.map((group) => (
                  <section key={group.section} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">{group.section}</p>
                      <p className="mt-2 text-sm text-slate-400">{group.summary}</p>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {group.metrics.map((metric) => (
                        <div key={metric.id} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{metric.label}</p>
                          <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-400">{metric.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
                Aun no hay suficientes datos fundamentales estructurados para este activo.
              </div>
            )}
          </div>
        )}

        {/* Trading Dialog */}
      </div>
    </motion.div>
  );
}