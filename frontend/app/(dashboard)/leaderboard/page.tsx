"use client";

import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { 
  Award, 
  ExternalLink, 
  Search, 
  TrendingUp, 
  Trophy, 
  Users 
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const GET_LEADERBOARD = gql`
  query GetLeaderboard {
    leaderboard {
      id
      name
      performance
      shareSlug
      positions {
        symbol
      }
    }
  }
`;

interface LeaderboardPosition {
  symbol: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  performance: number;
  shareSlug: string;
  positions: LeaderboardPosition[];
}

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, loading, error } = useQuery(GET_LEADERBOARD, {
    pollInterval: 300000, // Sync every 5 mins
  });

  const rankings = useMemo(() => {
    const list = data?.leaderboard || [];
    if (!searchTerm) return list;
    return list.filter((p: LeaderboardEntry) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.positions.some((pos: LeaderboardPosition) => pos.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  if (error) return (
    <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
      <h2 className="text-lg font-semibold">Error al cargar el ranking</h2>
      <p className="mt-2 text-sm">{error.message}</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 18 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <section className="panel overflow-hidden p-8 sm:p-10 relative">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Trophy className="h-40 w-40 text-emerald-300" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3">
            <p className="eyebrow">Arquitectura de éxito</p>
            <InfoTooltip
              title="Ranking Global"
              description="El leaderboard muestra los portafolios públicos con mejor rendimiento. Compara tus resultados con otros traders y aprende de sus estrategias. Solo los portafolios marcados como públicos aparecen aquí."
            />
          </div>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            TOP Estrategias Globales.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Descubre las carteras públicas con mayor rendimiento en tiempo real. 
            Aprende de los mejores y replica sus asignaciones de activos.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="panel-muted flex flex-1 items-center gap-3 px-5 py-3.5">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre de portafolio o activo..." 
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6 px-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-slate-500">Usuarios</p>
                <p className="text-xl font-bold text-white flex items-center gap-2 justify-center">
                  <Users className="h-4 w-4 text-emerald-300" />
                  {rankings.length}+
                </p>
              </div>
            </div>
        </div>
      </section>

      <section className="grid gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="panel h-24 animate-pulse" />
          ))
        ) : (
          rankings.map((portfolio: LeaderboardEntry, index: number) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="panel hover:bg-white/[0.04] transition-colors border-white/5">
                <CardContent className="flex items-center gap-6 p-6">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${
                    index === 0 ? "bg-amber-300 text-amber-950 shadow-[0_0_20px_rgba(252,211,77,0.3)]" :
                    index === 1 ? "bg-slate-300 text-slate-950" :
                    index === 2 ? "bg-orange-400 text-orange-950" :
                    "bg-white/5 text-slate-400"
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white truncate">{portfolio.name}</h3>
                      {index < 3 && <Award className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {portfolio.positions.map((pos: LeaderboardPosition) => (
                        <span key={pos.symbol} className="text-[10px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-slate-500 border border-white/5">
                          {pos.symbol}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right hidden sm:block px-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Rendimiento</p>
                    <p className={`text-2xl font-black ${portfolio.performance >= 0 ? "text-emerald-300" : "text-red-400"}`}>
                      {portfolio.performance >= 0 ? "+" : ""}{portfolio.performance.toFixed(2)}%
                    </p>
                  </div>

                  <Button asChild className="rounded-xl bg-white/5 hover:bg-white/10 text-white border-white/5">
                    <Link href={`/share/${portfolio.shareSlug}`}>
                      Ver Táctica
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

        {rankings.length === 0 && !loading && (
          <div className="panel p-20 text-center space-y-4">
             <TrendingUp className="h-12 w-12 text-slate-600 mx-auto" />
             <p className="text-slate-400">No hay carteras públicas que coincidan con tu búsqueda.</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
