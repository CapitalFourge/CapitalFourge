"use client";

import { gql, useQuery } from "@apollo/client";
import { 
  ArrowLeft, 
  Coins, 
  ExternalLink, 
  Landmark, 
  TrendingUp, 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { Button as UIButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GET_SHARED_PORTFOLIO = gql`
  query GetSharedPortfolio($slug: String!) {
    sharedPortfolio(slug: $slug) {
      id
      name
      description
      performance
      isPublic
      positions {
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
  }
`;

interface SharedPosition {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
}

interface SharedPortfolio {
  id: string;
  name: string;
  description: string;
  performance: number;
  isPublic: boolean;
  positions: SharedPosition[];
}

export default function SharedPortfolioPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, loading, error } = useQuery(GET_SHARED_PORTFOLIO, {
    variables: { slug },
  });

  const portfolio = data?.sharedPortfolio as SharedPortfolio | undefined;

  const totalValue = useMemo(() => {
    if (!portfolio?.positions) return 0;
    return portfolio.positions.reduce((sum: number, pos: SharedPosition) => sum + (pos.quantity * pos.currentPrice), 0);
  }, [portfolio]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-300"></div>
    </div>
  );

  if (error || !portfolio) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dashboard p-10 text-center">
      <h1 className="text-4xl font-bold text-white">404 - Cartera no encontrada</h1>
      <p className="mt-4 text-slate-400">Este portafolio no existe o ya no es público.</p>
      <UIButton asChild className="mt-8 rounded-full bg-emerald-300 text-slate-950">
        <Link href="/">Volver al inicio</Link>
      </UIButton>
    </div>
  );

  return (
    <main className="relative min-h-screen bg-dashboard p-6 pb-20 sm:p-10 lg:p-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      
      <div className="relative mx-auto max-w-6xl space-y-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Ver mercado global
            </Link>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl">
              {portfolio.name}
            </h1>
            <p className="max-w-2xl text-lg text-slate-400">
              {portfolio.description || "Analizando oportunidades con Capital Fourge Intelligence."}
            </p>
          </div>
          
          <div className="panel flex flex-col items-center justify-center bg-emerald-300/10 p-8 text-center md:items-end md:text-right">
            <p className="eyebrow text-emerald-300">Rendimiento neto</p>
            <p className="mt-2 text-6xl font-black text-emerald-300">
              {portfolio.performance > 0 ? "+" : ""}{portfolio.performance.toFixed(2)}%
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="metric-tile">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Valor en Activos</p>
              <Landmark className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-4 text-4xl font-bold text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Posiciones</p>
              <Coins className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-4 text-4xl font-bold text-white">{portfolio.positions.length}</p>
          </div>
          <Card className="panel border-emerald-300/30 bg-emerald-300/5">
             <CardContent className="flex h-full flex-col justify-center p-6 text-center">
                <p className="text-sm font-medium text-emerald-100">¿Quieres estos mismos resultados?</p>
                <Link href="/register" className="mt-3 text-lg font-bold text-emerald-300 hover:underline">
                  Crea tu portafolio gratis →
                </Link>
             </CardContent>
          </Card>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Asignación actual</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.positions.map((pos: SharedPosition) => (
                <div key={pos.symbol} className="panel flex items-center justify-between p-5">
                  <div>
                    <span className="text-xl font-bold text-white">{pos.symbol}</span>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Instrumento verificado</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">${(pos.quantity * pos.currentPrice).toLocaleString()}</p>
                    <p className="text-xs text-emerald-300">Market Price: ${pos.currentPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <div className="panel p-7 space-y-6 border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
                Copiar estrategia
              </h3>
              <p className="text-sm leading-7 text-slate-400">
                Puedes comprar estos mismos activos en nuestros partners verificados para replicar este rendimiento.
              </p>
              
              <div className="space-y-3">
                {Array.from(new Set(portfolio.positions.map((p: SharedPosition) => p.symbol))).map((symbol) => (
                  <UIButton key={symbol} asChild variant="outline" className="w-full justify-between rounded-xl border-white/10 py-6 text-slate-200">
                    <a href="https://www.binance.com/register?ref=REFERRAL" target="_blank" className="flex items-center gap-2">
                      <span>Operar {symbol} en Binance</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </UIButton>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
