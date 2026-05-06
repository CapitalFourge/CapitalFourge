"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CashActionDialog } from "@/components/trading/cash-action-dialog";
import { SymbolAutocomplete } from "@/components/trading/symbol-autocomplete";
import { TradeDialog } from "@/components/trading/trade-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimePrice } from "@/lib/hooks/useRealTimePrice";
import { useMemo } from "react";
import { EnhancedPriceChart } from "@/components/trading/enhanced-price-chart";
import { IndicatorSelector } from "@/components/trading/indicator-selector";


const DASHBOARD_QUERY = gql`
  query GetDashboardData($symbol: String!, $days: Int!) {
    me {
      id
      username
      cashBalance
      lockedBalance
    }
    portfolios {
      id
      name
      performance
      positions {
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
    priceHistory(symbol: $symbol, days: $days) {
      price
      date
    }
  }
`;

const WATCHLIST = ["BTC-USD", "ETH-USD", "AAPL", "TSLA", "NVDA", "MSFT", "GC=F", "SI=F"];

interface Position {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice?: number;
}

interface Portfolio {
  id: string;
  name: string;
  performance: number;
  positions: Position[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDays, setSelectedDays] = useState(30); // Default to 1M
  const realTimePrice = useRealTimePrice([activeSymbol]);

  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    variables: { symbol: activeSymbol, days: selectedDays },
    pollInterval: 60000,
  });

  const currentPrice =
    realTimePrice[activeSymbol] ??
    (data?.priceHistory?.length > 0 ? data.priceHistory[data.priceHistory.length - 1].price : 0);

  const userCashBalance = data?.me?.cashBalance || 0;
  const userLockedBalance = data?.me?.lockedBalance || 0;
  const portfolios = useMemo(() => ((data?.portfolios as Portfolio[] | undefined) ?? []), [data?.portfolios]);
  const leadPortfolio = portfolios[0];

  const investedTotal = useMemo(() => {
    return portfolios.reduce((total, portfolio) => {
      const portfolioInvested =
        portfolio.positions?.reduce((sum, position) => {
          return sum + position.quantity * (position.currentPrice || position.averagePurchasePrice);
        }, 0) || 0;

      return total + portfolioInvested;
    }, 0);
  }, [portfolios]);

  const totalBalance = userCashBalance + userLockedBalance + investedTotal;

  const portfolioPositions = useMemo(() => {
    const map = new Map<string, Position[]>();

    portfolios.forEach((portfolio) => {
      map.set(portfolio.id, portfolio.positions || []);
    });

    return map;
  }, [portfolios]);

  if (error) {

  }, [data?.priceHistory, selectedIndicators]);
    return indicators;
    
    });
      }
        }
          break;
          };
            type: "line"
            });
              lower: d.lower
              middle: d.middle,
              upper: d.upper,
              date: d.date,
            data: bbData.map(function(d) { return {
            id: "bollinger",
          indicators.push({
          const bbData = calculateBollingerBands(priceData);
        case "bollinger": {
        }
          break;
          });
            type: "line"
            });
              histogram: d.histogram
              signal: d.signal,
              macd: d.macd,
              date: d.date,
            data: macdData.map(function(d) { return {
            id: "macd",
          indicators.push({
          const macdData = calculateMACD(priceData);
        case "macd": {
        }
          break;
          });
            type: "line"
            data: rsiData.map(function(d) { return { date: d.date, rsi: d.rsi }; }),
            id: "rsi",
          indicators.push({
          const rsiData = calculateRSI(priceData, 14);
        case "rsi": {
        }
          break;
          });
            type: "line"
            data: emaData.map(function(d) { return { date: d.date, ema: d.ema }; }),
            id: "ema",
          indicators.push({
          const emaData = calculateEMA(priceData, 20);
        case "ema": {
        }
          break;
          });
            type: "line"
            data: smaData.map(function(d) { return { date: d.date, sma: d.sma }; }),
            id: "sma",
          indicators.push({
          const smaData = calculateSMA(priceData, 20);
        case "sma": {
      switch (indicator) {
    selectedIndicators.forEach(function(indicator) {
    
    const indicators: IndicatorData[] = [];
    
    const priceData = data.priceHistory.map(function(p) { return { date: p.date, close: p.price }; });
    // Convert price history to the format expected by technical indicators
    
    if (!data?.priceHistory || selectedIndicators.length === 0) return [];
  const indicatorsData = useMemo(() => {
  // Calculate technical indicators based on selected indicators
  
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar el dashboard</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Patrimonio total",
      value: totalBalance,
      accent: "text-white",
      icon: Landmark,
    },
    {
      label: "Caja disponible",
      value: userCashBalance,
      accent: "text-emerald-300",
      icon: Wallet,
    },
    {
      label: "Capital invertido",
      value: investedTotal,
      accent: "text-sky-300",
      icon: TrendingUp,
    },
    {
      label: "Saldo retenido",
      value: userLockedBalance,
      accent: "text-amber-300",
      icon: Clock3,
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.section variants={item} className="panel overflow-hidden p-6 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="eyebrow">Resumen ejecutivo</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  {data?.me?.username ? `Hola, ${data.me.username}.` : "Panel principal."}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Supervisa caja, exposición y mercado activo desde una misma superficie de trabajo.
                </p>
              </div>

              <div className="panel-muted flex items-center gap-3 self-start px-4 py-3">
                <span className="status-dot" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sistema</p>
                  <p className="text-sm font-medium text-white">Conectado en tiempo real</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div key={stat.label} className="metric-tile">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${stat.accent}`}>
                      ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel-muted flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Activo observado</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">{activeSymbol}</p>
              </div>
              <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                ${Number(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>\n            </div>\n            <div className=\"mt-4\">\n              <TimeframeSelector selectedDays={selectedDays} onChange={setSelectedDays} />\n            </div>\n\n            <SymbolAutocomplete
            </div>
            <div className="mt-4">
              <IndicatorSelector selectedIndicators={selectedIndicators} onChange={setSelectedIndicators} />
            </div>

              value={searchInput}
              onChange={(value) => {
                setSearchInput(value);
                if (value.trim()) {
                  setActiveSymbol(value.trim().toUpperCase());
                }
              }}
              placeholder="Buscar ticker o símbolo"
              className="w-full"
              inputClassName="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-sm tracking-[0.18em] text-white placeholder:text-slate-500"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portafolios</p>
                <p className="mt-2 text-2xl font-semibold text-white">{portfolios.length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Instrumentos clave</p>
                <p className="mt-2 text-2xl font-semibold text-white">{WATCHLIST.length}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <motion.section variants={item} className="space-y-6">
          <Card className="panel overflow-hidden border-white/10 py-0">
            <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
              <div>
                <p className="eyebrow">Mercado</p>
                <CardTitle className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  Precio de referencia {selectedDays === null ? 'TODO' : selectedDays === 1 ? '1 día' : selectedDays === 7 ? '1 semana' : selectedDays === 30 ? '1 mes' : selectedDays === 90 ? '3 meses' : selectedDays === 180 ? '6 meses' : selectedDays === 365 ? '1 año' : 'Todo'}
                </CardTitle>
              </div>
              <Clock3 className="h-5 w-5 text-slate-500" />
            </CardHeader>
            <CardContent className="h-[400px] px-2 pb-4 pt-0 sm:px-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Activity className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <EnhancedPriceChart
                    data={data?.priceHistory || []}
                    indicators={indicatorsData}
                    showPriceArea={true}
                  />
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <motion.div variants={item} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {leadPortfolio ? (
              <>
                <TradeDialog portfolios={portfolios} defaultType="buy" portfolioPositions={portfolioPositions} />
                <TradeDialog portfolios={portfolios} defaultType="sell" portfolioPositions={portfolioPositions} />
                <CashActionDialog initialType="deposit" />
                <CashActionDialog initialType="withdraw" />
              </>
            ) : (
              <div className="panel col-span-full p-8 text-center">
                <p className="text-lg font-semibold text-white">Aún no tienes un portafolio activo.</p>
                <p className="mt-2 text-sm text-slate-400">
                  Crea tu primera cartera para comenzar a operar y ver métricas consolidadas.
                </p>
                <Button asChild className="mt-5 rounded-full bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                  <Link href="/portfolio">Ir a portafolios</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </motion.section>

        <motion.aside variants={item} className="space-y-6">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Watchlist</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Seguimiento rápido</h2>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-5 space-y-3">
              {WATCHLIST.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setActiveSymbol(symbol)}
                  className={`flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${
                    activeSymbol === symbol
                      ? "border-emerald-300/40 bg-emerald-300/12 text-white"
                      : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{symbol}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mercado monitoreado</p>
                  </div>
                  <Activity className={activeSymbol === symbol ? "h-4 w-4 text-emerald-200" : "h-4 w-4 text-slate-500"} />
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <p className="eyebrow">Estado de mercado</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Liquidez intradía</span>
                <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-sm text-emerald-200">Alta</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Volatilidad agregada</span>
                <span className="rounded-full bg-amber-300/12 px-3 py-1 text-sm text-amber-200">Media</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Cobertura</span>
                <span className="rounded-full bg-sky-300/12 px-3 py-1 text-sm text-sky-200">Multi-activo</span>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
