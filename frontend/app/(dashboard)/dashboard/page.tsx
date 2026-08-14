"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { Clock3, ExternalLink, Landmark, RefreshCcw, TrendingUp, Trophy, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { CashActionDialog } from "@/components/trading/cash-action-dialog";
import { TradeDialog } from "@/components/trading/trade-dialog";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const DASHBOARD_QUERY = gql`
  query GetDashboardData {
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
        id
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
  }
`;

const ASSET_MOVERS_QUERY = gql`
  query GetAssetMovers($sort: String!, $limit: Int!) {
    assetMovers(sort: $sort, limit: $limit) {
      topGainers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      topLosers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      mostTraded {
        symbol
        name
        price
        changePercent
        changeValue
        volume
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

interface Portfolio {
  id: string;
  name: string;
  performance: number;
  positions: Position[];
}

interface AssetMover {
  symbol: string;
  name?: string | null;
  price: number;
  changePercent: number;
  changeValue: number;
  volume: number;
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
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const formatSignedCurrency = (value: number) => `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
const formatMetricVolume = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: value >= 100 ? 0 : 2,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });

export default function DashboardPage() {
  const [volatilitySort, setVolatilitySort] = useState<"volatile" | "gain" | "loss">("volatile");

  const { data, error, loading } = useQuery(DASHBOARD_QUERY, {
    pollInterval: 60000,
    fetchPolicy: "cache-and-network",
  });

  const { data: moversData, loading: moversLoading } = useQuery(ASSET_MOVERS_QUERY, {
    variables: { sort: volatilitySort, limit: 20 },
    pollInterval: 60000,
    fetchPolicy: "cache-and-network",
  });

  const portfolios = useMemo(() => ((data?.portfolios as Portfolio[] | undefined) ?? []), [data?.portfolios]);
  
  // Combine all movers into a flat array for filtering/sorting
  const allMovers = useMemo(() => {
    const movers = moversData?.assetMovers;
    if (!movers) return [];
    const combined = [
      ...(movers.topGainers ?? []),
      ...(movers.topLosers ?? []),
      ...(movers.mostTraded ?? [])
    ];
    // Dedupe by symbol
    const seen = new Set<string>();
    return combined.filter(asset => {
      if (seen.has(asset.symbol)) return false;
      seen.add(asset.symbol);
      return true;
    });
  }, [moversData?.assetMovers]);

  const volatileAssets = useMemo(() => {
    const baseAssets = allMovers;

    switch (volatilitySort) {
      case "gain":
        return baseAssets
          .filter(asset => asset.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent) // Descending (highest gain first)
          .slice(0, 20); // Limit to 20

      case "loss":
        return baseAssets
          .filter(asset => asset.changePercent < 0)
          .sort((a, b) => a.changePercent - b.changePercent) // Ascending (most negative first)
          .slice(0, 20); // Limit to 20

      case "volatile":
      default:
        // Sort by absolute changePercent (highest volatility = biggest move in either direction)
        return baseAssets
          .sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0))
          .slice(0, 20); // Limit to 20
    }
  }, [allMovers, volatilitySort]);
  
  const leadPortfolio = portfolios[0];
  const userCashBalance = data?.me?.cashBalance ?? 0;
  const userLockedBalance = data?.me?.lockedBalance ?? 0;

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-300 border-t-transparent" />
        </div>
        <p className="text-center text-slate-400">Cargando dashboard...</p>
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
                Supervisa caja, exposicion y estado general de tus carteras desde una sola superficie de trabajo.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <CashActionDialog initialType="deposit">
                  <Button className="h-11 rounded-full border border-emerald-300/30 bg-emerald-300/8 px-5 text-sm font-semibold text-emerald-200 shadow-[0_0_0_1px_rgba(110,231,183,0.08)] hover:bg-emerald-400/14 hover:text-emerald-100">
                    <RefreshCcw className="h-4 w-4" />
                    Recarga
                  </Button>
                </CashActionDialog>
                <CashActionDialog initialType="withdraw">
                  <Button className="h-11 rounded-full border border-rose-300/30 bg-rose-300/8 px-5 text-sm font-semibold text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.08)] hover:bg-rose-400/14 hover:text-rose-100">
                    <Wallet className="h-4 w-4" />
                    Retiro
                  </Button>
                </CashActionDialog>
              </div>

              <div className="flex items-center gap-2 self-end">
                <InfoTooltip
                  title="Panel principal"
                  description="Aquí ves tu patrimonio total, caja disponible, capital invertido y saldo retenido. Usa 'Recarga' para agregar dinero de papel sin límites y 'Retiro' para mover fondos entre cuentas."
                />
                <div className="panel-muted flex items-center gap-3 px-4 py-3">
                  <span className="status-dot" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sistema</p>
                    <p className="text-sm font-medium text-white">Conectado en tiempo real</p>
                  </div>
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

      <div className="space-y-6">
        <motion.div variants={item}>
          <section className="panel p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Portafolios</p>
                <div className="mt-2 flex items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                    {portfolios.length > 0 ? "Vista consolidada de tus carteras" : "Aun no tienes portafolios"}
                  </h2>
                  <InfoTooltip
                    title="Portafolio"
                    description="Un portafolio es un conjunto de activos financieros organizados bajo una estrategia. Puedes crear uno desde 'Crear mi primer portafolio'. Los portafolios pueden ser privados (solo los ves tú) o públicos (los ven tú y otros usuarios en el leaderboard)."
                  />
                </div>
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

            <div className="mt-6">
              {portfolios.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Portfolios list */}
                  <div className="space-y-3 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                    {portfolios.map((portfolio) => (
                      <Link
                        key={portfolio.id}
                        href={`/portfolio/${portfolio.id}`}
                        className="flex items-center justify-between rounded-[1.2rem] border border-white/6 bg-slate-950/35 px-4 py-3 transition hover:bg-white/[0.04] hover:border-emerald-300/30"
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
                      </Link>
                    ))}
                  </div>

                  {/* Right: Leaderboard - Próximamente */}
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-emerald-300" />
                      <p className="text-lg font-semibold text-white">Leaderboard</p>
                    </div>
                    <p className="text-sm text-slate-400 text-center max-w-xs">
                      Ranking público de portafolios con mejor rendimiento. Disponible próximamente.
                    </p>
                    <span className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-300 bg-emerald-300/10 px-3 py-1 rounded-full">
                      Próximamente
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-start justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6">
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
          </section>
        </motion.div>

        <motion.section variants={item} className="panel p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">Volatilidad</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Activos mas volatiles</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Sigue los instrumentos con mayor desplazamiento reciente junto con su actividad operada para entender por que dominan el flujo.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { value: "volatile", label: "Mas volatiles" },
              { value: "gain", label: "Ganancias" },
              { value: "loss", label: "Perdidas" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVolatilitySort(option.value as typeof volatilitySort)}
                className={
                  volatilitySort === option.value
                    ? "rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1.5 text-xs font-medium text-emerald-200"
                    : "rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/8 hover:bg-white/5 hover:text-white"
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          {moversLoading ? (
            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-[1.25rem] border border-white/8 bg-slate-950/25 px-3 py-2 animate-pulse">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="h-5 w-20 bg-white/10 rounded" />
                      <div className="mt-1 h-3 w-32 bg-white/5 rounded" />
                    </div>
                    <div className="text-right">
                      <div className="h-5 w-24 bg-white/10 rounded" />
                      <div className="mt-1 h-4 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 lg:grid-cols-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {volatileAssets.map((asset) => (
                <Link
                  key={asset.symbol}
                  href={`/explorer/${asset.symbol}`}
                  className="rounded-[1.25rem] border border-white/8 bg-slate-950/25 px-3 py-2 transition hover:bg-white/[0.04] hover:border-emerald-300/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{asset.symbol}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{asset.name || "Activo monitoreado"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-white">{formatCurrency(asset.price)}</p>
                      <p
                        className={
                          asset.changePercent >= 0
                            ? "mt-1 text-base font-semibold text-emerald-300"
                            : "mt-1 text-base font-semibold text-rose-300"
                        }
                      >
                        {formatSignedPercent(asset.changePercent)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{formatSignedCurrency(asset.changeValue)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <ExternalLink className="h-4 w-4 text-slate-500 hover:text-emerald-300 transition" />
                  </div>
                </Link>
              ))}
              {volatileAssets.length === 0 && (
                <div className="rounded-[1.1rem] border border-dashed border-white/10 bg-slate-950/25 px-4 py-6 text-sm text-slate-400 lg:col-span-2">
                  No hay suficientes datos de mercado para calcular volatilidad ahora mismo.
                </div>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
