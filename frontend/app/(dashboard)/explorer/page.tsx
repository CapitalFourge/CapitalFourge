"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Coins,
  Globe,
  Info,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXPLORER_QUERY = gql`
  query GetExplorerData($category: String) {
    assetsByCategory(category: $category) {
      symbol
      name
      category
    }
    portfolios {
      id
      name
      positions {
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
  }
`;

const CATEGORIES = [
  { id: "ALL", name: "Todos", icon: Globe },
  { id: "STOCKS", name: "Acciones", icon: TrendingUp },
  { id: "CRYPTO", name: "Cripto", icon: Coins },
  { id: "COMMODITIES", name: "Materias primas", icon: BarChart3 },
  { id: "FOREX", name: "Forex", icon: Activity },
];

interface Asset {
  symbol: string;
  name?: string;
  category: string;
}

interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
}

interface Portfolio {
  id: string;
  name: string;
  positions: PortfolioPosition[];
}

export default function ExplorerPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error } = useQuery(EXPLORER_QUERY, {
    variables: { category: selectedCategory === "ALL" ? null : selectedCategory },
  });

  const assets = useMemo(() => ((data?.assetsByCategory as Asset[] | undefined) ?? []), [data?.assetsByCategory]);
  const portfolios = useMemo(
    () =>
      (((data?.portfolios as Portfolio[] | undefined) ?? []).map((portfolio) => ({
        ...portfolio,
        positions: portfolio.positions || [],
      }))),
    [data?.portfolios]
  );

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const term = searchTerm.toLowerCase();
      return asset.symbol.toLowerCase().includes(term) || asset.name?.toLowerCase().includes(term);
    });
  }, [assets, searchTerm]);

  const portfolioPositions = useMemo(() => {
    const map = new Map<string, PortfolioPosition[]>();
    portfolios.forEach((portfolio) => map.set(portfolio.id, portfolio.positions));
    return map;
  }, [portfolios]);

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar el explorador</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <section className="panel p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Exploración de mercado</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Instrumentos globales.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Filtra por categoría, busca por símbolo y abre una operación sin salir del contexto de análisis.
            </p>
          </div>

          <div className="panel-muted flex w-full max-w-xl items-center gap-3 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por símbolo o nombre"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
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

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="panel h-[240px] animate-pulse" />
            ))
          : filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Card className="panel h-full border-white/10 py-0">
                  <CardHeader className="px-6 pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                        {asset.category}
                      </span>
                      <Info className="h-4 w-4 text-slate-500" />
                    </div>
                    <CardTitle className="mt-5 flex flex-col gap-2">
                      <span className="text-3xl font-semibold tracking-[-0.04em] text-white">{asset.symbol}</span>
                      <span className="text-sm font-normal text-slate-400">{asset.name || "Instrumento sin descripción"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4 px-6 pb-6">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 w-full rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                    >
                      <Link href={`/explorer/${asset.symbol}`}>Ver grafica y analisis</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

        {!loading && filteredAssets.length === 0 && (
          <div className="panel col-span-full flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
            <Activity className="h-10 w-10 text-slate-500" />
            <h2 className="mt-6 text-2xl font-semibold text-white">No hay resultados con esos filtros.</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Ajusta la categoría o el término de búsqueda para ampliar el universo visible.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
