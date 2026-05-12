"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Landmark,
  RefreshCcw,
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
const RANGE_OPTIONS = [1, 7, 30, 90, 180, 365];
const RANGE_LABELS: Record<number, string> = {
  1: "1 dia",
  7: "1 semana",
  30: "1 mes",
  90: "3 meses",
  180: "6 meses",
  365: "1 ano",
};

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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export default function DashboardPage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDays, setSelectedDays] = useState(30);
  const [volatilitySort, setVolatilitySort] = useState<"volatile" | "gain" | "loss" | "volume">("volatile");

  const realTimeSymbols = useMemo(() => [activeSymbol], [activeSymbol]);
  const realTimePrice = useRealTimePrice(realTimeSymbols);

  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    variables: { symbol: activeSymbol, days: selectedDays },
    pollInterval: 60000,
  });

  const portfolios = useMemo(() => ((data?.portfolios as Portfolio[] | undefined) ?? []), [data?.portfolios]);
  const leadPortfolio = portfolios[0];
  const userCashBalance = data?.me?.cashBalance ?? 0;
  const userLockedBalance = data?.me?.lockedBalance ?? 0;

  const currentPrice =
    realTimePrice[activeSymbol] ??
    (data?.priceHistory?.length ? data.priceHistory[data.priceHistory.length - 1].price : 0);

  const investedTotal = useMemo(() => {
    return portfolios.reduce((total, portfolio) => {
      const portfolioInvested =
        portfolio.positions?.reduce((sum, position) => {
          return sum + position.quantity * (position.currentPrice ?? position.averagePurchasePrice);
        }, 0) ?? 0;

      return total + portfolioInvested;
    }, 0);
  }, [portfolios]);

  const totalBalance = userCashBalance + userLockedBalance + investedTotal;

  const portfolioPositions = useMemo(() => {
    const map = new Map<string, Position[]>();

    portfolios.forEach((portfolio) => {
      map.set(portfolio.id, portfolio.positions ?? []);
    });

    return map;
  }, [portfolios]);

  const totalPositions = useMemo(
    () => portfolios.reduce((total, portfolio) => total + (portfolio.positions?.length ?? 0), 0),
    [portfolios],
  );

  const chartData = useMemo(
    () =>
      (data?.priceHistory ?? []).map((entry: { date: string; price: number }) => ({
        date: new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: Number(entry.price),
      })),
    [data?.priceHistory],
  );

  const volatileAssets = useMemo(() => {
    const baseAssets = [
      { symbol: "BTC-USD", price: "$67,420.50", changePercent: 2.34, changeValue: "+$1,540.25" },
      { symbol: "ETH-USD", price: "$3,450.75", changePercent: -1.87, changeValue: "-$65.42" },
      { symbol: "AAPL", price: "$198.52", changePercent: 3.21, changeValue: "+$6.18" },
      { symbol: "TSLA", price: "$248.90", changePercent: -4.15, changeValue: "-$10.82" },
      { symbol: "NVDA", price: "$875.30", changePercent: 5.67, changeValue: "+$46.92" },
      { symbol: "MSFT", price: "$420.15", changePercent: 1.23, changeValue: "+$5.10" },
      { symbol: "GC=F", price: "$2,345.60", changePercent: 0.89, changeValue: "+$20.75" },
      { symbol: "SI=F", price: "$28.90", changePercent: -2.45, changeValue: "-$0.73" },
    ];

    return [...baseAssets].sort((a, b) => {
      if (volatilitySort === "volatile") {
        return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      }
      if (volatilitySort === "gain") {
        return b.changePercent - a.changePercent;
      }
      if (volatilitySort === "loss") {
        return a.changePercent - b.changePercent;
      }
      return a.symbol.localeCompare(b.symbol);
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

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar el dashboard</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.section variants={item} className="panel overflow-hidden p-6 sm:p-7">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Resumen ejecutivo</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                {data?.me?.username ? `Hola, ${data.me.username}.` : "Panel principal."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Supervisa caja, exposicion y mercado activo desde una misma superficie de trabajo.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <CashActionDialog initialType="deposit">
                  <Button className="h-11 rounded-full bg-transparent px-5 text-sm font-semibold text-emerald-300 shadow-none hover:bg-emerald-400/10 hover:text-emerald-200">
                    <RefreshCcw className="h-4 w-4" />
                    Recarga
                  </Button>
                </CashActionDialog>
                <CashActionDialog initialType="withdraw">
                  <Button className="h-11 rounded-full bg-transparent px-5 text-sm font-semibold text-rose-300 shadow-none hover:bg-rose-400/10 hover:text-rose-200">
                    <Wallet className="h-4 w-4" />
                    Retiro
                  </Button>
                </CashActionDialog>
              </div>

              <div className="panel-muted flex items-center gap-3 self-start px-4 py-3 xl:self-end">
                <span className="status-dot" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sistema</p>
                  <p className="text-sm font-medium text-white">Conectado en tiempo real</p>
                </div>
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
                    {formatCurrency(stat.value)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <motion.div variants={item} className="space-y-6">
          <section className="panel p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Portafolios</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  {portfolios.length > 0 ? "Vista consolidada de tus carteras" : "Aun no tienes portafolios"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  {portfolios.length > 0
                    ? "Revisa desempeno, posiciones activas y accesos directos para operar sin salir del tablero."
                    : "Crea tu primer portafolio para empezar a operar y ver metricas consolidadas en este espacio."}
                </p>
              </div>

              {leadPortfolio ? (
                <div className="flex flex-wrap gap-3">
                  <TradeDialog portfolios={portfolios} defaultType="buy" portfolioPositions={portfolioPositions} />
                  <TradeDialog portfolios={portfolios} defaultType="sell" portfolioPositions={portfolioPositions} />
                </div>
              ) : (
                <Button asChild className="h-11 rounded-full bg-emerald-300 px-5 text-slate-950 hover:bg-emerald-200">
                  <Link href="/portfolio">Crear mi primer portafolio</Link>
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_240px]">
              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                {portfolios.length > 0 ? (
                  <div className="space-y-3">
                    {portfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="flex items-center justify-between rounded-[1.2rem] border border-white/6 bg-slate-950/35 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">{portfolio.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            {portfolio.positions?.length ?? 0} posiciones activas
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={
                              portfolio.performance >= 0
                                ? "text-sm font-semibold text-emerald-300"
                                : "text-sm font-semibold text-rose-300"
                            }
                          >
                            {formatSignedPercent(portfolio.performance)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Rendimiento</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-start justify-center rounded-[1.2rem] border border-dashed border-white/10 bg-slate-950/25 px-5 py-6">
                    <p className="text-lg font-semibold text-white">Tu espacio esta listo para empezar.</p>
                    <p className="mt-2 max-w-xl text-sm text-slate-400">
                      Cuando crees tu primer portafolio, aqui veras su desempeno, posiciones y accesos para comprar o vender.
                    </p>
                    <Button asChild className="mt-5 rounded-full bg-emerald-300 px-5 text-slate-950 hover:bg-emerald-200">
                      <Link href="/portfolio">Crear un portafolio</Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Instrumentos clave</p>
                <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">{WATCHLIST.length}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {totalPositions > 0
                    ? `${totalPositions} posiciones abiertas distribuidas en tus portafolios.`
                    : "Tu watchlist ya esta lista para construir la primera cartera."}
                </p>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Mercado</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  Precio de referencia de {activeSymbol}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Serie historica en {RANGE_LABELS[selectedDays]} con actualizacion de precio en tiempo real.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-200">
                  {formatCurrency(Number(currentPrice || 0))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {RANGE_OPTIONS.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setSelectedDays(range)}
                      className={
                        selectedDays === range
                          ? "rounded-full bg-emerald-300/15 px-3 py-1.5 text-xs font-medium text-emerald-200"
                          : "rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                      }
                    >
                      {RANGE_LABELS[range]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="space-y-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Activo observado</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{activeSymbol}</p>
                </div>

                <SymbolAutocomplete
                  value={searchInput}
                  onChange={(value) => {
                    setSearchInput(value);
                    if (value.trim()) {
                      setActiveSymbol(value.trim().toUpperCase());
                    }
                  }}
                  placeholder="Buscar ticker o simbolo"
                  className="w-full"
                  inputClassName="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-slate-500"
                />

                <div className="space-y-2">
                  {WATCHLIST.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        setActiveSymbol(symbol);
                        setSearchInput(symbol);
                      }}
                      className={
                        activeSymbol === symbol
                          ? "flex w-full items-center justify-between rounded-[1rem] border border-emerald-300/35 bg-emerald-300/10 px-3 py-3 text-left text-white"
                          : "flex w-full items-center justify-between rounded-[1rem] border border-white/8 bg-slate-950/20 px-3 py-3 text-left text-slate-300 transition hover:bg-white/[0.04]"
                      }
                    >
                      <div>
                        <p className="font-medium">{symbol}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">Mercado monitoreado</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">
                    {loading && chartData.length === 0 ? "Cargando historial..." : "Precio historico"}
                  </p>
                  <Activity className="h-4 w-4 text-slate-500" />
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="dashboardPriceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#61f0c7" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#61f0c7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={72}
                        tickFormatter={(value: number) => `$${Math.round(value)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#61f0c7"
                        strokeWidth={2.5}
                        fill="url(#dashboardPriceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.aside variants={item} className="space-y-6">
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Volatilidad</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Activos mas volatiles</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { value: "volatile", label: "Mas volatiles" },
                { value: "gain", label: "Ganancias" },
                { value: "loss", label: "Perdidas" },
                { value: "volume", label: "Volumen" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVolatilitySort(option.value as typeof volatilitySort)}
                  className={
                    volatilitySort === option.value
                      ? "rounded-full bg-emerald-300/15 px-3 py-1.5 text-xs font-medium text-emerald-200"
                      : "rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              {volatileAssets.map((asset) => (
                <div
                  key={asset.symbol}
                  className="rounded-[1.1rem] border border-white/8 bg-slate-950/25 px-4 py-3 transition hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{asset.symbol}</p>
                      <p className="mt-1 text-xs text-slate-500">{asset.price}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          asset.changePercent >= 0
                            ? "text-sm font-semibold text-emerald-300"
                            : "text-sm font-semibold text-rose-300"
                        }
                      >
                        {formatSignedPercent(asset.changePercent)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{asset.changeValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <p className="eyebrow">Estado de mercado</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Liquidez intradia</span>
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
          </section>
        </motion.aside>
      </div>
    </motion.div>
  );
}
