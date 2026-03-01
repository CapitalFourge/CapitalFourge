"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search, TrendingUp, Globe, Coins,
    BarChart3, Activity,
    ChevronRight, Info
} from "lucide-react";
import { TradeDialog } from "@/components/trading/trade-dialog";

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
    { id: "COMMODITIES", name: "Materias Primas", icon: BarChart3 },
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
    positions?: PortfolioPosition[];
}

export default function ExplorerPage() {
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const { data, loading, error } = useQuery(EXPLORER_QUERY, {
        variables: { category: selectedCategory === "ALL" ? null : selectedCategory }
    });

    const assets: Asset[] = data?.assetsByCategory || [];
    const portfolios: Portfolio[] = data?.portfolios || [];

    const filteredAssets = assets.filter((a: Asset) =>
        a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Create a map of portfolio positions for TradeDialog
    const portfolioPositions = new Map<string, PortfolioPosition[]>();
    portfolios.forEach((p: Portfolio) => {
        portfolioPositions.set(p.id, p.positions || []);
    });

    if (error) return (
        <div className="p-10 text-red-400 font-mono bg-red-500/5 rounded-3xl border border-red-500/20">
            <h2 className="text-xl font-bold mb-2">ERROR_DE_EXPLORADOR</h2>
            <p className="opacity-70">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tighter uppercase italic">Explorador de Mercados</h1>
                <p className="text-slate-500 uppercase text-[10px] tracking-[0.3em] mt-2">Descubre y Opera Activos Globales en Tiempo Real</p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="BUSCAR_INSTRUMENTO (EJ: ORO, AAPL, BTC)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border-none py-6 pl-14 pr-6 rounded-2xl text-xs font-bold tracking-widest text-white placeholder:text-slate-700 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === cat.id
                                    ? "bg-white text-black"
                                    : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                <Icon size={14} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />
                    ))
                ) : (
                    filteredAssets.map((asset: Asset) => (
                        <Card key={asset.symbol} className="glass border-none group hover:bg-white/[0.05] transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="px-3 py-1 rounded-full bg-white/5 text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                                        {asset.category}
                                    </div>
                                    <Info size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <CardTitle className="pt-4 flex flex-col">
                                    <span className="text-2xl font-black italic tracking-tighter">{asset.symbol}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{asset.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex gap-2">
                                    <TradeDialog
                                        portfolios={portfolios}
                                        defaultType="buy"
                                        portfolioPositions={portfolioPositions}
                                        initialSymbol={asset.symbol}
                                    />
                                    <Button size="icon" variant="outline" className="w-12 h-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {!loading && filteredAssets.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <h3 className="text-slate-500 font-bold uppercase tracking-widest">Sin resultados_encontrados</h3>
                        <p className="text-[10px] text-slate-700 uppercase tracking-widest mt-2">Intenta ajustar los filtros o el término de búsqueda</p>
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-between pt-10 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Live_Feed_OK</span>
                    </div>
                    <div className="h-3 w-px bg-white/10" />
                    <span className="text-[9px] text-slate-700 uppercase font-bold tracking-widest">Total_Instrumentos: {filteredAssets.length}</span>
                </div>
                <p className="text-[9px] text-zinc-800 uppercase tracking-[0.6em] font-mono">Finsight_Exploration_Unit</p>
            </div>
        </div>
    );
}
