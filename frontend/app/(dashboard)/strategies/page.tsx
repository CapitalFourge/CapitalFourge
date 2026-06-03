'use client';

import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const STRATEGIES_QUERY = gql`
  query GetStrategies {
    portfolios {
      id
      name
      performance
      isPublic
    }
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
    id: "delorean",
    name: "Delorean - Multiestrategia",
    description: "Combina multiples estrategias en ETFs. Operacion alcista con rotacion dinámica.",
    winRate: 62,
    avgReturn: 28.79,
    maxDrawdown: -15.37,
    category: "Tendencia",
    popularity: 95,
  },
  {
    id: "retrosp",
    name: "RetroSP - Reversión SP500",
    description: "Busca retrocesos en acciones del SP500. Entra cuando el precio vuelve a la media.",
    winRate: 69.5,
    avgReturn: 8.8,
    maxDrawdown: -15.72,
    category: "Contra-tendencia",
    popularity: 88,
  },
  {
    id: "rsi-divergences",
    name: "Divergencias RSI Alcistas",
    description: "Señal cuando RSI hace nuevo maximo pero el precio no. Funciona en todas las decadas.",
    winRate: 53.7,
    avgReturn: 0.51,
    maxDrawdown: -8,
    category: "Indicadores",
    popularity: 92,
  },
  {
    id: "momentum-nasdaq",
    name: "Momentum Nasdaq 100",
    description: "Compra cuando el momentum de 10 dias cruza arriba de cero con RSI < 90.",
    winRate: 70.9,
    avgReturn: 4.23,
    maxDrawdown: -33,
    category: "Tendencia",
    popularity: 78,
  },
  {
    id: "chappie",
    name: "Chappie - Rotacional ETF",
    description: "Selecciona el mejor ETF mensual según ranking. Operacion larga únicamente.",
    winRate: 61.9,
    avgReturn: 14.91,
    maxDrawdown: -18.53,
    category: "Tendencia",
    popularity: 85,
  },
  {
    id: "breakout",
    name: "Breakout Trading",
    description: "Rompe resistencias con volumen creciente. Busca movimientos fuertes del mercado.",
    winRate: 69.5,
    avgReturn: 12.8,
    maxDrawdown: -12,
    category: "Ruptura",
    popularity: 82,
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
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <p className="eyebrow">Estrategias comprobadas</p>
              <InfoTooltip
                title="Estrategias"
                description="Las estrategias son planes de inversión predefinidos con datos históricos reales. Elige una según tu perfil de riesgo (agresivo o conservador) y aplícala creando un portafolio. Están aquí para que aprendas a operar sin empezar de cero."
              />
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Aprende y aplica.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Estrategias con datos reales de rendimiento. Filtra por categoria y encuentra la que mejor se adapte a tu estilo.
            </p>
          </div>
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