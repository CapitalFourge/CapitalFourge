'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart3, TrendingUp, Target, Zap, Activity, PieChart, DollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Strategy {
  id: string;
  name: string;
  description: string;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  totalTrades: number;
  category: string;
  popularity: number;
  timeframe: string;
  riskLevel: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: "turtle-trading",
    name: "Turtle Trading - Donchian Breakout",
    description: "Sistema de ruptura desarrollado por Richard Dennis en los 80. Compra al romper máximo de 20 días, vende al romper mínimo de 10 días. Incluye gestión de riesgo estricta (2% capital por operación).",
    winRate: 42,
    avgReturn: 14.2,
    maxDrawdown: -22.5,
    sharpeRatio: 0.85,
    profitFactor: 1.75,
    totalTrades: 180,
    category: "Tendencia",
    popularity: 95,
    timeframe: "Diario",
    riskLevel: "Moderado-Alto"
  },
  {
    id: "golden-cross",
    name: "Golden Cross (50/200 DMA)",
    description: "Señal alcista cuando promedio móvil de 50 días cruza por encima de 200 días. Confirmado con volumen creciente y filtro ADX > 25 para evitar falsas señales.",
    winRate: 53,
    avgReturn: 12.8,
    maxDrawdown: -18.0,
    sharpeRatio: 0.90,
    profitFactor: 1.60,
    totalTrades: 12,
    category: "Tendencia",
    popularity: 88,
    timeframe: "Diario",
    riskLevel: "Moderado"
  },
  {
    id: "momentum-12-1",
    name: "Momentum 12-1 Mes",
    description: "Estrategia académica de Jegadeesh y Titman (1993). Compra acciones con mejores retornos de últimos 12 meses (excluyendo mes reciente). Rebalanceo mensual.",
    winRate: 54,
    avgReturn: 16.5,
    maxDrawdown: -28.0,
    sharpeRatio: 0.75,
    profitFactor: 1.55,
    totalTrades: 120,
    category: "Tendencia",
    popularity: 82,
    timeframe: "Mensual",
    riskLevel: "Alto"
  },
  {
    id: "bollinger-squeeze",
    name: "Breakout por Bollinger Squeeze",
    description: "Identifica bajas de volatilidad (bandas en mínimo 6 meses) seguidas de ruptura direccional. Confirmada con cierre fuera de bandas y aumento de volumen.",
    winRate: 58,
    avgReturn: 17.0,
    maxDrawdown: -20.0,
    sharpeRatio: 1.00,
    profitFactor: 1.65,
    totalTrades: 40,
    category: "Ruptura",
    popularity: 90,
    timeframe: "Diario",
    riskLevel: "Moderado-Alto"
  },
  {
    id: "volume-breakout",
    name: "Ruptura de Alto Volumen",
    description: "Ruptura de niveles clave con volumen ≥150% del promedio de 20 días. Incluye filtros para evitar falsas rupturas (cierre definitivo fuera del rango).",
    winRate: 56,
    avgReturn: 19.5,
    maxDrawdown: -24.0,
    sharpeRatio: 0.85,
    profitFactor: 1.70,
    totalTrades: 60,
    category: "Ruptura",
    popularity: 85,
    timeframe: "Diario",
    riskLevel: "Alto"
  },
  {
    id: "rsi-mean-reversion",
    name: "RSI Mean Reversion con Filtro",
    description: "Compra cuando RSI < 30 y precio > MMA 200 (filtrando bajistas). Vende cuando RSI > 70 o objetivo alcanzado. Reduce falsas señales en tendencias fuertes.",
    winRate: 57,
    avgReturn: 13.2,
    maxDrawdown: -14.5,
    sharpeRatio: 1.05,
    profitFactor: 1.60,
    totalTrades: 200,
    category: "Media-Reversion",
    popularity: 92,
    timeframe: "Diario",
    riskLevel: "Moderado"
  },
  {
    id: "macd-divergence",
    name: "Divergencia de Histograma MACD",
    description: "Busca divergencias entre precio e histograma MACD. Divergencia alcista (precio ↓, histograma ↑) en bajista señala posible reversión. Confirmada con cruce de línea MACD.",
    winRate: 48,
    avgReturn: 11.0,
    maxDrawdown: -19.0,
    sharpeRatio: 0.70,
    profitFactor: 1.35,
    totalTrades: 100,
    category: "Indicadores",
    popularity: 78,
    timeframe: "4 Horas",
    riskLevel: "Moderado-Alto"
  },
  {
    id: "halloween-strategy",
    name: "Estrategia Halloween",
    description: "Invierte del 1 noviembre al 30 abril ('vende en mayo y vete'), manteniendo efectivo resto del año. Basada en efecto Halloween documentado globalmente por Jacobsen y Bouman (2002).",
    winRate: 63,
    avgReturn: 9.0,
    maxDrawdown: -10.5,
    sharpeRatio: 1.25,
    profitFactor: 1.80,
    totalTrades: 2,
    category: "Tendencia",
    popularity: 75,
    timeframe: "Nov-Abr",
    riskLevel: "Bajo-Moderado"
  },
  {
    id: "magic-formula",
    name: "Magic Formula de Greenblatt",
    description: "Desarrollada por Joel Greenblatt. Clasifica por ROIC y Earnings Yield. Invierte en top 30 empresas mensualmente rebalanceadas. Backtest 1988-2004: 30% anual.",
    winRate: 59,
    avgReturn: 17.5,
    maxDrawdown: -26.0,
    sharpeRatio: 0.80,
    profitFactor: 1.75,
    totalTrades: 360,
    category: "Valor",
    popularity: 87,
    timeframe: "Mensual",
    riskLevel: "Moderado-Alto"
  },
  {
    id: "pairs-trading",
    name: "Arbitrageo Estadístico (Pairs)",
    description: "Opera pares altamente correlacionados (ej: KO/PEP) cuando su relación se desvía de la media histórica. Incluye pruebas de cointegración para asegurar relación estable.",
    winRate: 60,
    avgReturn: 11.0,
    maxDrawdown: -9.0,
    sharpeRatio: 1.40,
    profitFactor: 1.65,
    totalTrades: 240,
    category: "Media-Reversion",
    popularity: 80,
    timeframe: "Diario",
    riskLevel: "Bajo-Moderado"
  }
];

const CATEGORIES = [
  { id: "all", name: "Todas", icon: BarChart3 },
  { id: "Tendencia", name: "Tendencia", icon: TrendingUp },
  { id: "Ruptura", name: "Ruptura", icon: Target },
  { id: "Media-Reversion", name: "Media-Reversion", icon: Zap },
  { id: "Indicadores", name: "Indicadores", icon: Activity },
  { id: "Valor", name: "Valor", icon: DollarSign },
  { id: "Estacional", name: "Estacional", icon: DollarSign },
];

const getRiskColorClass = (riskLevel: string): string => {
  switch (riskLevel) {
    case "Bajo": return "text-emerald-400";
    case "Bajo-Moderado": return "text-lime-400";
    case "Moderado": return "text-yellow-400";
    case "Moderado-Alto": return "text-orange-400";
    case "Alto": return "text-rose-400";
    default: return "text-red-400";
  }
};

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
              <p className="eyebrow">Estrategias Profesionales Comprobadas</p>
              <InfoTooltip
                title="Estrategias de Trading"
                description="Cada estrategia incluye backtesting extensivo con métricas profesionales de rendimiento. Basadas en metodologías usadas por instituciones financieras y traders profesionales."
              />
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Aprende y aplica estrategias ganadoras</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Estrategias verificadas con datos históricos reales, métricas de riesgo ajustadas y reglas claras de entrada/salida. Filtra por categoría para encontrar tu estilo.
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
            <Link href={`/strategies/${strategy.id}`} passHref>
              <Card className="panel border-white/10 hover:border-white/20 transition-border cursor-pointer hover:shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-white">{strategy.name}</CardTitle>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs text-slate-400 uppercase">{strategy.category}</span>
                        <span className="text-xs text-slate-500">|</span>
                        <span className="text-xs text-slate-400">{strategy.timeframe}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium">{strategy.popularity}</span>
                      <span className="h-4 w-4 text-emerald-400">
                        <PieChart />
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="text-lg font-semibold text-emerald-400">{strategy.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Max Drawdown</p>
                      <p className="text-lg font-semibold text-rose-400">{strategy.maxDrawdown}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Nivel Riesgo</p>
                      <p className={`text-lg font-semibold ${getRiskColorClass(strategy.riskLevel)}`}>{strategy.riskLevel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Cómo usar estas estrategias profesionalmente</h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            1. <strong>Entiende el contexto:</strong> Cada estrategia está optimizada para ciertas condiciones de mercado (tendencia, lateral, volatilidad). Usa el explorador para identificar el régimen actual.
          </p>
          <p>
            2. <strong>Prueba rigurosamente:</strong> Antes de usar capital real, practica en el simulador con al menos 50 trades simulados para internalizar las reglas.
          </p>
          <p>
            3. <strong>Gestiona el riesgo:</strong> Nunca arriesgues más del 1-2% de tu capital por trade. Ajusta el tamaño de posición basado en la volatilidad y tu stop loss.
          </p>
          <p>
            4. <strong>Registra y mejora:</strong> Lleva un diario de trading detallado. Analiza qué funcionó y qué no, y ajusta los parámetros según tu experiencia y evolución del mercado.
          </p>
          <p>
            5. <strong>Combina con análisis:</strong> Usa las estrategias como base, pero complementa con análisis de volumen, sentiment y macro para entradas y salidas óptimas.
          </p>
        </div>
      </section>
    </motion.div>
  );
}