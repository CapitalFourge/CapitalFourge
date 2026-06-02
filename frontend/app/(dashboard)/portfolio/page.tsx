"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, BriefcaseBusiness, Wallet } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

import { CreatePortfolioDialog } from "@/components/trading/create-portfolio-dialog";
import { DeletePortfolioButton } from "@/components/trading/delete-portfolio-button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const PORTFOLIOS_QUERY = gql`
  query GetPortfolios {
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

export default function PortfoliosPage() {
  const { data, loading, error } = useQuery(PORTFOLIOS_QUERY);

  if (loading) {
    return <div className="p-8 text-sm uppercase tracking-[0.26em] text-slate-400">Cargando portafolios...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar portafolios</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  const portfolios = (data?.portfolios || []) as Portfolio[];

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <section className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <div className="flex items-center gap-3">
            <p className="eyebrow">Arquitectura de carteras</p>
            <InfoTooltip
              title="Portafolio"
              description="Un portafolio es un conjunto de activos financieros organizados bajo una estrategia de inversión. Crea uno desde 'Crear mi primer portafolio'. Puede ser privado (solo lo ves tú) o público (aparece en el leaderboard para que otros lo vean)."
            />
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Tus portafolios activos.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Organiza estrategias, revisa rendimiento histórico y entra al detalle de cada cartera sin perder contexto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="panel-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-semibold text-white">{portfolios.length}</p>
          </div>
          <CreatePortfolioDialog />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {portfolios.map((portfolio, index) => {
          const invested =
            portfolio.positions?.reduce((sum, position) => {
              return sum + position.quantity * (position.currentPrice || position.averagePurchasePrice);
            }, 0) || 0;

          return (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: index * 0.05 }}
            >
              <Link href={`/portfolio/${portfolio.id}`} className="block h-full">
                <Card className="panel h-full border-white/10 py-0 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <CardHeader className="flex flex-row items-start justify-between px-6 pt-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portfolio</p>
                      <CardTitle className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                        {portfolio.name || `Estrategia ${portfolio.id.slice(0, 4)}`}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                      <DeletePortfolioButton id={portfolio.id} />
                      <div className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 px-6 pb-6 pt-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Capital invertido</p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                        ${invested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Activity className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.22em]">Rendimiento</span>
                        </div>
                        <p className={`mt-3 text-2xl font-semibold ${portfolio.performance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                          {portfolio.performance >= 0 ? "+" : ""}
                          {portfolio.performance?.toFixed(2) || "0.00"}%
                        </p>
                      </div>

                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <BriefcaseBusiness className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.22em]">Posiciones</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-white">{portfolio.positions?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="status-dot" />
                      Activo
                    </div>
                    <span className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
                      ID {portfolio.id.slice(0, 8)}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          );
        })}

        {portfolios.length === 0 && (
          <div className="panel col-span-full flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] text-slate-300">
              <Wallet className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Aún no hay carteras creadas.</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Crea una estrategia inicial para empezar a consolidar rendimiento, posiciones y reportes.
            </p>
            <div className="mt-6">
              <CreatePortfolioDialog />
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
