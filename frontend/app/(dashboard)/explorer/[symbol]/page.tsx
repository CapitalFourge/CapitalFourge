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
import { calculateSMA, calculateEMA, calculateWMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateStochastic, calculateOBV, calculateROC } from "@/lib/technicalIndicators";
import { IndicatorData } from "@/lib/indicatorTypes";

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
      price
      date
      volume
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
  const portfolios = data?.portfolios || [];

  const fullChartData = useMemo(
    () =>
      priceHistory
        .map((point: { date: string; price: number; volume?: number }) => ({
          date: point.date,
          price: point.price,
          volume: point.volume || 0,
        }))
        .filter((point: { date: string; price: number }) => !Number.isNaN(Date.parse(point.date)) && point.price > 0),
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
    
    const priceData = chartData.map((p: { date: string; price: number; volume: number }) => ({
      date: p.date,
      close: p.price,
      high: p.price,
      low: p.price,
      volume: p.volume,
    }));

    const indicators: IndicatorData[] = [];

    selectedIndicators.forEach(indicator => {
      switch (indicator) {
        case "sma": {
          const smaData = calculateSMA(priceData, 20);
          indicators.push({
            id: "sma",
            type: "line",
            data: smaData.map((d: { date: string; sma: number }) => ({
              date: d.date,
              sma: d.sma
            }))
          });
          break;
        }
        case "ema": {
          const emaData = calculateEMA(priceData, 20);
          indicators.push({
            id: "ema",
            type: "line",
            data: emaData.map((d: { date: string; ema: number }) => ({
              date: d.date,
              ema: d.ema
            }))
          });
          break;
        }
        case "wma": {
          const wmaData = calculateWMA(priceData, 20);
          indicators.push({
            id: "wma",
            type: "line",
            data: wmaData.map((d: { date: string; wma: number }) => ({
              date: d.date,
              wma: d.wma
            }))
          });
          break;
        }
        case "rsi": {
          const rsiData = calculateRSI(priceData, 14);
          indicators.push({
            id: "rsi",
            type: "line",
            data: rsiData.map((d: { date: string; rsi: number }) => ({
              date: d.date,
              rsi: d.rsi
            }))
          });
          break;
        }
        case "macd": {
          const macdData = calculateMACD(priceData);
          indicators.push({
            id: "macd",
            type: "line",
            data: macdData.map((d: { date: string; macd: number; signal: number; histogram: number }) => ({
              date: d.date,
              macd: d.macd,
              signal: d.signal,
              histogram: d.histogram
            }))
          });
          break;
        }
        case "bollinger": {
          const bbData = calculateBollingerBands(priceData);
          indicators.push({
            id: "bollinger",
            type: "line",
            data: bbData.map((d: { date: string; upper: number; middle: number; lower: number }) => ({
              date: d.date,
              upper: d.upper,
              middle: d.middle,
              lower: d.lower
            }))
          });
          break;
        }
        case "stochastic": {
          const stochasticData = calculateStochastic(priceData);
          indicators.push({
            id: "stochastic",
            type: "line",
            data: stochasticData.map((d: { date: string; k: number; d: number }) => ({
              date: d.date,
              stochastick: d.k,
              stochastics: d.d
            }))
          });
          break;
        }
        case "roc": {
          const rocData = calculateROC(priceData, 12);
          indicators.push({
            id: "roc",
            type: "line",
            data: rocData.map((d: { date: string; roc: number }) => ({
              date: d.date,
              roc: d.roc
            }))
          });
          break;
        }
        case "obv": {
          const obvData = calculateOBV(priceData);
          indicators.push({
            id: "obv",
            type: "line",
            data: obvData.map((d: { date: string; obv: number }) => ({
              date: d.date,
              obv: d.obv
            }))
          });
          break;
        }
      }
    });

    return indicators;
  }, [chartData, selectedIndicators]);

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
                `$${chartData[chartData.length - 1].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '$0.00'}
            </p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
            <p className="mt-2 text-2xl font-semibold">
              {chartData.length >= 2 ? 
                (
                  ((chartData[chartData.length - 1].price - chartData[chartData.length - 2].price) / chartData[chartData.length - 2].price) * 100
                ).toFixed(2) + '%' : 
                '0.00%'}
              <span className={(chartData.length >= 2) ? (chartData[chartData.length - 1].price > chartData[chartData.length - 2].price ? 'text-emerald-400' : 'text-rose-400') : undefined}>
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

        {/* Technical Indicators */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Indicadores técnicos</h2>
          <IndicatorSelector 
            selectedIndicators={selectedIndicators} 
            onChange={setSelectedIndicators} 
          />
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
