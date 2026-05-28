'use client';

import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STRATEGIES_QUERY = gql`
  query GetStrategies {
    # Por ahora usamos datos mock, en el futuro vendran del backend
    # portfolios {
    #   id
    #   name
    #   performance
    #   isPublic
    # }
  }
`;

interface Strategy {
  id: string;
  name: string;
  description: string;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  category: string;
  popularity: number;
}

const STRATEGIES: Strategy[] = [
  {
    id: "trend-following",
    name: "Trend Following",
    description: "Sigue la tendencia usando medias moviles y rupturas de niveles.",
    winRate: 58.3,
    avgReturn: 12.4,
    maxDrawdown: -8.2,
    category: "Tendencia",
    popularity: 87,
  },
  {
    id: "breakout",
    name: "Breakout Trading",
    description: "Busca romper resistencias con volumen creciente.",
    winRate: 45.1,
    avgReturn: 18.7,
    maxDrawdown: -15.3,
    category: "Ruptura",
    popularity: 92,
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description: "Aprovecha cuando el precio se aleja de su promedio para volver.",
    winRate: 62.5,
    avgReturn: 8.9,
    maxDrawdown: -5.1,
    category: "Contra-tendencia",
    popularity: 76,
  },
  {
    id: "swing",
    name: "Swing Trading",
    description: "Operaciones de 2-5 dias basadas en patrones de velas.",
    winRate: 55.2,
    avgReturn: 6.8,
    maxDrawdown: -12.4,
    category: "Patrones",
    popularity: 84,
  },
];

const CATEGORIES = [
  { id: "all", name: "Todas", icon: BarChart3 },
  { id: "Tendencia", name: "Tendencia", icon: TrendingUp },
  { id: "Ruptura", name: "Ruptura", icon: Target },
  { id: "Contra-tendencia", name: "Contra-tendencia", icon: Shield },
  { id: "Patrones", name: "Patrones", icon: BarChart3 },
];

export default function StrategiesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredStrategies = STRATEGIES.filter(strategy => 
    selectedCategory === "all" || strategy.category === selectedCategory
  );

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <section className="panel p-6 sm:p-7">
        <div>
          <p className="eyebrow">Estrategias comprobadas</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Aprende y aplica.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Estrategias con datos reales de rendimiento. Filtra por categoria y encuentra la que mejor se adapte a tu estilo.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
                  active
                    ? "border-emerald-300/40 bg-emerald-300/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredStrategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <Card className="panel border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-white">{strategy.name}</CardTitle>
                    <CardDescription className="mt-1 text-slate-400">{strategy.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="text-emerald-400">{strategy.popularity}</span>
                    <span>★</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-300">{strategy.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Win Rate</p>
                    <p className="text-lg font-semibold text-emerald-400">{strategy.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Retorno promedio</p>
                    <p className="text-lg font-semibold text-white">{strategy.avgReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Max Drawdown</p>
                    <p className="text-lg font-semibold text-rose-400">{strategy.maxDrawdown}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">¿Cómo usar estas estrategias?</h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            1. Elige una estrategia según tu perfil de riesgo y tiempo disponible.
          </p>
          <p>
            2. Practica primero en datos históricos sin arriesgar dinero real.
          </p>
          <p>
            3. Usa los indicadores y figuras en el explorador para identificar entradas.
          </p>
          <p>
            4. Registra tus trades en un portafolio publico para comparar en el ranking.
          </p>
        </div>
      </section>
    </motion.div>
  );
}