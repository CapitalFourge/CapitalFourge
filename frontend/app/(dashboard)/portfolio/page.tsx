"use client";

import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowUpRight, Activity, Wallet } from "lucide-react";
import Link from "next/link";
import { CreatePortfolioDialog } from "@/components/trading/create-portfolio-dialog";
import { DeletePortfolioButton } from "@/components/trading/delete-portfolio-button";

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

export default function PortfoliosPage() {
    const { data, loading, error } = useQuery(PORTFOLIOS_QUERY);

    if (loading) return (
        <div className="p-10 animate-pulse text-slate-500 font-mono tracking-widest uppercase">
            CARGANDO_PORTAFOLIOS...
        </div>
    );

    if (error) return (
        <div className="p-10 text-red-400 font-mono bg-red-500/5 rounded-3xl border border-red-500/20">
            <h2 className="text-xl font-bold mb-2">ERROR_DE_CONEXIÓN</h2>
            <p className="opacity-70">{error.message}</p>
        </div>
    );

    const portfolios = data?.portfolios || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">Centro de Estrategias</h1>
                    <p className="text-slate-500 uppercase text-xs tracking-[0.3em] mt-2">Aislamiento de Workspaces y Despliegue de Capital</p>
                </div>
                <CreatePortfolioDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((p: any) => (
                    <Link key={p.id} href={`/portfolio/${p.id}`} className="relative group">
                        <Card className="glass border-none hover:bg-white/[0.05] transition-all cursor-pointer h-full group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px]">
                                    {p.name || `Strategy_${p.id.substring(0, 4)}`}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <DeletePortfolioButton id={p.id} />
                                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Valor Invertido</p>
                                    <p className="text-3xl font-mono text-white font-bold">
                                        ${(p.positions?.reduce((sum: number, pos: any) => sum + (pos.quantity * (pos.currentPrice || pos.averagePurchasePrice)), 0) || 0)
                                            .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Activity size={12} className="text-slate-500" />
                                        <span className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">Rendimiento Hist.</span>
                                    </div>
                                    <span className={`text-xs font-bold font-mono ${Number(p.performance) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {Number(p.performance) >= 0 ? "+" : ""}{p.performance?.toFixed(2) || 0}%
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between items-center text-[9px] font-mono border-t border-white/5 mt-2 py-4">
                                <div className="flex items-center gap-1 text-green-500/60 uppercase">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    ESTADO: ACTIVO
                                </div>
                                <span className="text-slate-600 uppercase tracking-tighter">WS_ID: #{p.id.substring(0, 8)}</span>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}

                {portfolios.length === 0 && (
                    <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-slate-600 bg-white/[0.01]">
                        <Wallet size={32} className="mb-4 opacity-20" />
                        <p className="uppercase tracking-[0.4em] text-sm font-bold text-slate-400">Sin Despliegues Activos</p>
                        <p className="text-[10px] mt-4 uppercase tracking-[0.2em] opacity-50 text-center leading-relaxed">
                            Tus workspaces de trading seguro aparecerán aquí<br />una vez inicializados los modelos.
                        </p>
                    </div>
                )}
            </div>

            <div className="pt-10 flex gap-4 opacity-20 justify-center">
                <div className="h-px w-20 bg-white" />
                <span className="text-[10px] uppercase font-mono tracking-[0.5em]">FINSIGHT_PORTFOLIO_ENGINE</span>
                <div className="h-px w-20 bg-white" />
            </div>
        </div>
    );
}