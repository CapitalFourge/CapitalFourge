"use client";

console.log("[DEBUG] Dashboard module loaded");

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery, gql } from "@apollo/client";
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
    Clock, Wallet,
    Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRealTimePrice } from "@/lib/hooks/useRealTimePrice";
import { TradeDialog } from "@/components/trading/trade-dialog";
import { CashActionDialog } from "@/components/trading/cash-action-dialog";
import { SymbolAutocomplete } from "@/components/trading/symbol-autocomplete";

console.log("[DEBUG] All imports completed");

const DASHBOARD_QUERY = gql`
  query GetDashboardData($symbol: String!, $days: Int!) {
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
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
    priceHistory(symbol: $symbol, days: $days) {
      price
      date
    }
  }
`;

const WATCHLIST = ["BTC-USD", "ETH-USD", "AAPL", "TSLA", "NVDA", "MSFT", "GC=F", "SI=F"];

export default function DashboardPage() {
    console.log("[DEBUG] DashboardPage rendering - checking auth and API connectivity...");
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    console.log("[DEBUG] Auth token present:", !!token);

    const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
    const [searchInput, setSearchInput] = useState("");
    const realTimePrice = useRealTimePrice([activeSymbol]);

    const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
        variables: { symbol: activeSymbol, days: 30 },
        pollInterval: 60000,
    });

    const currentPrice = realTimePrice[activeSymbol] ?? (data?.priceHistory?.length > 0
        ? data.priceHistory[data.priceHistory.length - 1].price
        : 0);

    const portfolio = data?.portfolios?.[0];
    const userCashBalance = data?.me?.cashBalance || 0;
    const userLockedBalance = data?.me?.lockedBalance || 0;

    interface Position {
        symbol: string;
        quantity: number;
        averagePurchasePrice: number;
        currentPrice?: number;
    }

    interface Portfolio {
        id: string;
        name: string;
        positions: Position[];
    }

    const investedTotal = useMemo(() => {
        if (!data?.portfolios) return 0;
        return (data.portfolios as Portfolio[]).reduce((total: number, p: Portfolio) => {
            const portfolioInvested = p.positions?.reduce((sum: number, pos: Position) => {
                return sum + (pos.quantity * (pos.currentPrice || pos.averagePurchasePrice));
            }, 0) || 0;
            return total + portfolioInvested;
        }, 0);
    }, [data?.portfolios]);

    const totalBalance = userCashBalance + userLockedBalance + investedTotal;

    // Create a map of portfolio positions for TradeDialog
    const portfolioPositions = useMemo(() => {
        const map = new Map<string, Position[]>();
        (data?.portfolios as Portfolio[])?.forEach((p: Portfolio) => {
            map.set(p.id, p.positions || []);
        });
        return map;
    }, [data?.portfolios]);

    // Debug logging for portfolio positions
    useEffect(() => {
        console.log("[DEBUG Dashboard] data:", data);
        console.log("[DEBUG Dashboard] data?.portfolios:", data?.portfolios);
        console.log("[DEBUG Dashboard] portfolioPositions map:", portfolioPositions);
    }, [data, portfolioPositions]);

    if (error) return (
        <div className="p-10 text-red-400 font-mono bg-red-500/5 rounded-3xl border border-red-500/20">
            <h2 className="text-xl font-bold mb-2">ERROR_DE_TERMINAL</h2>
            <p className="opacity-70">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter">TERMINAL_CENTRAL</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-slate-500 uppercase text-[10px] tracking-[0.3em]">Sistema_Online // Feed: En Vivo</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Search Bar */}
                    <SymbolAutocomplete
                        value={searchInput}
                        onChange={(value) => {
                            setSearchInput(value);
                            if (value.trim()) {
                                setActiveSymbol(value.trim().toUpperCase());
                            }
                        }}
                        placeholder="BUSCAR_TICKER..."
                        className="w-full md:w-64"
                        inputClassName="bg-white/5 border-white/5 py-6 rounded-2xl text-xs font-bold tracking-widest"
                    />

                    <div className="flex items-center gap-4 bg-white/5 p-4 py-3 rounded-2xl border border-white/5">
                        <div className="text-right">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Ticker_Activo</p>
                            <p className="text-xl font-black italic">{activeSymbol}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-1" />
                        <div className="text-left">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Último_Precio</p>
                            <p className="text-xl font-mono text-white">${Number(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 p-4 py-3 rounded-2xl border border-white/5">
                        <div className="text-right border-r border-white/10 pr-4">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Cash_Disponible</p>
                            <p className="text-lg font-mono font-bold text-green-400">
                                ${userCashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right border-r border-white/10 pr-4">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Invertido</p>
                            <p className="text-lg font-mono font-bold text-blue-400">
                                ${investedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right border-r border-white/10 pr-4">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Bloqueado</p>
                            <p className="text-lg font-mono font-bold text-orange-400">
                                ${userLockedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-green-500/60 text-[10px] uppercase tracking-widest font-bold">Total_Neto</p>
                            <p className="text-xl font-mono font-bold text-white">
                                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <Wallet className="text-green-500 w-5 h-5 ml-2" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-8">
                    <Card className="glass border-none overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Historial_Precios_30D
                            </CardTitle>
                            <Clock size={14} className="text-slate-500" />
                        </CardHeader>
                        <CardContent className="h-[430px] w-full pt-4">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Activity className="animate-spin text-white/20" size={40} />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.priceHistory}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#475569', fontSize: 10 }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            hide
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#fff"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {portfolio ? (
                            <>
                                <TradeDialog portfolios={data.portfolios} defaultType="buy" portfolioPositions={portfolioPositions} />
                                <TradeDialog portfolios={data.portfolios} defaultType="sell" portfolioPositions={portfolioPositions} />
                                <CashActionDialog initialType="deposit" />
                                <CashActionDialog initialType="withdraw" />
                            </>
                        ) : (
                            <div className="col-span-4 p-8 bg-white/5 border border-white/5 rounded-3xl text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">
                                    ⚠️ No hay portafolios detectados
                                </p>
                                <Button asChild className="bg-white text-black hover:bg-slate-200 rounded-xl font-bold">
                                    <Link href="/portfolio">Crer Primer Portafolio</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-500 pl-2">Lista_de_Seguimiento</p>
                    <div className="space-y-3">
                        {WATCHLIST.map((symbol) => (
                            <button
                                key={symbol}
                                onClick={() => setActiveSymbol(symbol)}
                                className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all border ${activeSymbol === symbol
                                    ? "bg-white text-black border-white"
                                    : "bg-white/5 text-white border-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                                    }`}
                            >
                                <span className="font-bold tracking-widest font-mono">{symbol}</span>
                                <Activity size={16} className={activeSymbol === symbol ? "opacity-100" : "opacity-20"} />
                            </button>
                        ))}
                    </div>

                    <Card className="glass border-white/5 bg-zinc-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Estado_del_Mercado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 uppercase">Liquidez_H24</span>
                                <span className="text-xs font-mono text-white">ALTA</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 uppercase">Volatilidad</span>
                                <span className="text-xs font-mono text-orange-400">MEDIA</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <p className="text-[10px] text-slate-600 italic uppercase">Motor de ejecución optimizado para baja latencia</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex items-center justify-center pt-10">
                <p className="text-[10px] text-zinc-800 uppercase tracking-[0.6em] font-mono">Finsight_Quant_Engine_v1.0.8</p>
            </div>
        </div>
    );
}