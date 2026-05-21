'use client';

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeDialog } from "@/components/trading/trade-dialog";
import { EnhancedPriceChart } from "@/components/trading/enhanced-price-chart";
import { IndicatorSelector } from "@/components/trading/indicator-selector";
import { LiquidityHeatmap } from "@/components/trading/liquidity-heatmap";
import { IndicatorData } from "@/lib/indicatorTypes";
import {
  FUNDAMENTAL_METRIC_CATALOG,
  type FundamentalCategory,
  type FundamentalMetricDefinition,
} from "@/lib/fundamental-metric-catalog";

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
    technicalIndicators(symbol: $symbol, days: 365) {
      id
      type
      points {
        date
        value
        signal
        histogram
        upper
        middle
        lower
        k
        d
      }
    }
    portfolios {
      id
      name
      positions {
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
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

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'buy' | 'sell'>('buy');

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = data?.priceHistory || [];
  const technicalIndicators = data?.technicalIndicators || [];
  const portfolios = data?.portfolios || [];
  const latestFundamental = priceHistory[priceHistory.length - 1] as FundamentalPricePoint | undefined;

  const fullChartData = useMemo(
    () =>
      priceHistory
        .map((point: FundamentalPricePoint) => ({
          date: point.date,
          open: point.open || point.close,
          high: point.high || point.close,
          low: point.low || point.close,
          close: point.close,
          volume: point.volume || 0,
        }))
        .filter((point: { date: string; close: number }) => !Number.isNaN(Date.parse(point.date)) && point.close > 0),
    [priceHistory]
  );

  const chartData = useMemo(() => {
    if (selectedDays >= 365 || fullChartData.length <= 2) {
      return fullChartData;
    }

    const pointsToKeep = selectedDays === 1 ? 2 : Math.min(fullChartData.length, selectedDays);
    return fullChartData.slice(-pointsToKeep);
  }, [fullChartData, selectedDays]);

  // Calculate technical indicators
  const indicatorsData = useMemo(() => {
    if (chartData.length === 0 || selectedIndicators.length === 0) return [];

    const visibleDates = new Set(chartData.map((point: { date: string }) => point.date));

    return selectedIndicators
      .map((indicatorId) => {
        const series = technicalIndicators.find((entry: { id: string }) => entry.id === indicatorId);
        if (!series) {
          return null;
        }

        return {
          id: series.id,
          type: series.type as IndicatorData["type"],
          data: series.points
            .filter((point: { date: string }) => visibleDates.has(point.date))
            .map((point: {
              date: string;
              value?: number | null;
              signal?: number | null;
              histogram?: number | null;
              upper?: number | null;
              middle?: number | null;
              lower?: number | null;
              k?: number | null;
              d?: number | null;
            }) => {
              switch (series.id) {
                case "macd":
                  return {
                    date: point.date,
                    macd: point.value ?? 0,
                    signal: point.signal ?? 0,
                    histogram: point.histogram ?? 0,
                  };
                case "bollinger":
                  return {
                    date: point.date,
                    upper: point.upper ?? 0,
                    middle: point.middle ?? 0,
                    lower: point.lower ?? 0,
                  };
                case "stochastic":
                  return {
                    date: point.date,
                    stochastick: point.k ?? 0,
                    stochastics: point.d ?? 0,
                  };
                default:
                  return {
                    date: point.date,
                    [series.id]: point.value ?? 0,
                  };
              }
            }),
        };
      })
      .filter((indicator): indicator is IndicatorData => indicator !== null);
  }, [chartData, selectedIndicators, technicalIndicators]);

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
        <div className="flex items-center gap-4">
          <Button 
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
            variant="outline" 
            onClick={() => {
              setDialogType('sell');
              setIsDialogOpen(true);
            }}
            className="text-sm px-4 py-2"
          >
            Vender
          </Button>
        </div>
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
              {chartData.length > 0 ? 
                `$${chartData[chartData.length - 1].close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '$0.00'}
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
            <p className="mt-2 text-2xl font-semibold">
              {chartData.length >= 2 ? 
                (
                  ((chartData[chartData.length - 1].close - chartData[chartData.length - 2].close) / chartData[chartData.length - 2].close) * 100
                ).toFixed(2) + '%' : 
                '0.00%'}
              <span className={(chartData.length >= 2) ? (chartData[chartData.length - 1].close > chartData[chartData.length - 2].close ? 'text-emerald-400' : 'text-rose-400') : undefined}>
              </span>
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {chartData.length > 0 ? 
                chartData[chartData.length - 1].volume.toLocaleString(undefined) : 
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Historial de precios</h2>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedDays(1)}
                className={selectedDays === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}
              >
                1D
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedDays(7)}
                className={selectedDays === 7 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}
              >
                1W
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedDays(30)}
                className={selectedDays === 30 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}
              >
                1M
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedDays(90)}
                className={selectedDays === 90 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}
              >
                3M
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedDays(365)}
                className={selectedDays === 365 ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}
              >
                1A
              </Button>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <div className="h-[400px]">
              <EnhancedPriceChart
                data={chartData}
                indicators={indicatorsData}
                showPriceArea={true}
              />
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-slate-400">
              No hay suficientes datos historicos para renderizar la grafica.
            </div>
          )}
        </div>

        <div className="mb-8">
          <IndicatorSelector selectedIndicators={selectedIndicators} onChange={setSelectedIndicators} />
        </div>

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Analisis fundamental</h2>
            <p className="mt-1 text-sm text-slate-400">
              Sintesis de metricas clave segun la categoria del activo usando el ultimo snapshot fundamental disponible.
            </p>
          </div>
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

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Mapa de calor de liquidez</h2>
            <p className="text-sm text-slate-400">Distribucion aproximada de actividad por rango de precios.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <LiquidityHeatmap data={chartData} />
          </div>
        </div>

        {/* Asset Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Información del activo</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Info className="h-4 w-4 text-slate-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-300">Descripción</p>
                <p className="mt-1 text-text">{asset.description || 'No hay descripción disponible para este activo.'}</p>
              </div>
            </div>
            
            {asset.website && (
              <div className="flex items-start gap-4">
                <ExternalLink className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Sitio web</p>
                  <a 
                    href={asset.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-400 hover:underline"
                  >
                    {asset.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trading Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Operar</h2>
          <div className="space-y-4">
            <Button 
              variant="default" 
              onClick={() => {
                setDialogType('buy');
                setIsDialogOpen(true);
              }}
              className="w-full"
            >
              Comprar {asset.symbol}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogType('sell');
                setIsDialogOpen(true);
              }}
              className="w-full"
            >
              Vender {asset.symbol}
            </Button>
          </div>
        </div>
      </div>

      {/* Trading Dialog */}
      <TradeDialog
        portfolios={portfolios}
        defaultType={dialogType}
        initialSymbol={symbol}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}
      />
    </motion.div>
  );
}
