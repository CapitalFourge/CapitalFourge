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
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDays, setSelectedDays] = useState(30); // Default to 1M
  const [volatilitySort, setVolatilitySort] = useState<"volatile" | "gain" | "loss" | "volume">("volatile");
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
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar el dashboard</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }


  const volatileAssets = useMemo(() => {
    // Mock data for volatile assets - in a real implementation, this would come from an API
    // For now, we'll use some sample data from our watchlist
    const baseAssets = [
      { symbol: "BTC-USD", price: "$67,420.50", changePercent: 2.34, changeValue: "+$1,540.25" },
      { symbol: "ETH-USD", price: "$3,450.75", changePercent: -1.87, changeValue: "-$65.42" },
      { symbol: "AAPL", price: "$198.52", changePercent: 3.21, changeValue: "+$6.18" },
      { symbol: "TSLA", price: "$248.90", changePercent: -4.15, changeValue: "-$10.82" },
      { symbol: "NVDA", price: "$875.30", changePercent: 5.67, changeValue: "+$46.92" },
      { symbol: "MSFT", price: "$420.15", changePercent: 1.23, changeValue: "+$5.10" },
      { symbol: "GC=F", price: "$2,345.60", changePercent: 0.89, changeValue: "+$20.75" },
      { symbol: "SI=F", price: "$28.90", changePercent: -2.45, changeValue: "-$0.73" }
    ];
    
    // Sort based on selected volatility type
    return [...baseAssets].sort((a, b) => {
      const changeA = Math.abs(a.changePercent);
      const changeB = Math.abs(b.changePercent);
      
      if (volatilitySort === "volatile") {
        return changeB - changeA; // Descending absolute change
      } else if (volatilitySort === "gain") {
        return b.changePercent - a.changePercent; // Descending change
      } else if (volatilitySort === "loss") {
        return a.changePercent - b.changePercent; // Ascending change (most negative first)
      } else if (volatilitySort === "volume") {
        // For volume, we'd need actual volume data - for now just randomize
        return Math.random() - 0.5;
      }
      return 0;
    });
  }, [volatilitySort]);

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
        <div className="grid gap-8 xl:grid-cols-[1.15fr 0.85fr]">
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
                      {stat.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {Number(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="mt-4">
              <SymbolAutocomplete
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
            </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portafolios</p>
                {portfolios.length > 0 ? (
                  <>
                    {portfolios.slice(0, 3).map((portfolio, index) => (
                      <div key={index} className="flex w-full items-center justify-between px-3 py-1 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-white">{portfolio.name}</p>
                          <p className="text-xs text-slate-400">{portfolio.positions?.length || 0} posiciones</p>
                        </div>
                        <div className="text-right">
                          <p className={portfolio.performance >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium>
                            {portfolio.performance.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {portfolios.length > 3 && (
                      <div className="flex w-full items-center justify-between px-3 py-1 text-sm text-slate-400">
                        <span>y {portfolios.length - 3} más...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex w-full items-center justify-between px-3 py-1 text-sm text-slate-400">
                    <span>Aún no tienes portafolios</span>
                    <Link href="/portfolio" className="text-emerald-400 hover:underline">Crear uno</Link>
                  </div>
                )}
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Instrumentos clave</p>
                <p className="mt-2 text-2xl font-semibold text-white">{WATCHLIST.length}</p>
              </div>
            </div>
          </div>
            </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr 0.65fr]">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-400">Volatilidad del día</span>
                  <div className="flex space-x-4">
                    <button onClick={() => setVolatilitySort('volatile')} className={`px-3 py-1 rounded text-sm ${volatilitySort === 'volatile' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}`}>
                      Más volátiles
                    </button>
                    <button onClick={() => setVolatilitySort('gain')} className={`px-3 py-1 rounded text-sm ${volatilitySort === 'gain' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}`}>
                      Mayores ganancias
                    </button>
                    <button onClick={() => setVolatilitySort('loss')} className={`px-3 py-1 rounded text-sm ${volatilitySort === 'loss' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}`}>
                      Mayores pérdidas
                    </button>
                    <button onClick={() => setVolatilitySort('volume')} className={`px-3 py-1 rounded text-sm ${volatilitySort === 'volume' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-50/50'}`}>
                      Mayor volumen
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {volatileAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-[0.75rem] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{asset.symbol}</div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium">{asset.price}</p>
                          <p className={asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-sm>
                            {asset.changePercent}% ({asset.changeValue})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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
                <div className="mt-4 space-x-3">
                  <Link href="/portfolio" className="btn-primary px-4 py-2 rounded">Crear portafolio</Link>
                  <Button asChild className="mt-0 rounded-full bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                    <Link href="/portfolio">Ir a portafolios</Link>
                  </Button>
                </div>
              </div>
            )}
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
                  className={`flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${activeSymbol === symbol ? "border-emerald-300/40 bg-emerald-300/12 text-white" : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"}`}
                >
                  <div>
                    <p className="font-medium text-white">{symbol}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mercado monitoreado</p>
                  </div>
                  <div className={activeSymbol === symbol ? "h-4 w-4 text-emerald-200" : "h-4 w-4 text-slate-500"}></div>
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
