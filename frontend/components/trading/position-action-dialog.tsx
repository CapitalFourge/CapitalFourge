"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingDown, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { TradeDialog } from "./trade-dialog";

interface Position {
    symbol: string;
    quantity: number;
    currentPrice: number;
    averagePurchasePrice: number;
}

interface Portfolio {
    id: string;
    name: string;
    positions: any[]; // Matches TradeDialog requirement
}

interface PositionActionDialogProps {
    position: Position | null;
    portfolio: Portfolio | null;
    allPortfolios: Portfolio[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PositionActionDialog({
    position,
    portfolio,
    allPortfolios,
    open,
    onOpenChange,
}: PositionActionDialogProps) {
    const [tradeType, setTradeType] = useState<"buy" | "sell" | null>(null);

    if (!position || !portfolio) return null;

    const currentPrice = position.currentPrice || 0;
    const avgCost = position.averagePurchasePrice || 0;
    const usdValue = position.quantity * currentPrice;
    const performance = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
    const isPositive = performance >= 0;

    const handleClose = () => {
        setTradeType(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic flex items-center gap-2">
                        <Info className="text-slate-500" size={20} />
                        Detalles de Posición
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl italic border border-white/5">
                                {position.symbol.substring(0, 2)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter">{position.symbol}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                                    {position.quantity.toFixed(4)} UNIDADES
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Valor_Actual</p>
                            <p className="text-3xl font-black text-white font-mono italic">
                                ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Precio_Mercado</p>
                            <p className="text-lg font-bold font-mono">${currentPrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Costo_Promedio</p>
                            <p className="text-lg font-bold font-mono text-slate-400">${avgCost.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 col-span-2 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Rendimiento_Total</p>
                                <p className={`text-2xl font-black font-mono italic ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                    {isPositive ? "+" : ""}{performance.toFixed(2)}%
                                </p>
                            </div>
                            {isPositive ? <ArrowUpRight className="text-emerald-400" size={32} /> : <ArrowDownRight className="text-red-400" size={32} />}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <TradeDialog
                            portfolios={allPortfolios}
                            defaultType="buy"
                            initialSymbol={position.symbol}
                        >
                            <Button className="h-14 rounded-2xl font-black gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none uppercase italic">
                                <ShoppingCart size={18} />
                                Aumentar
                            </Button>
                        </TradeDialog>

                        <TradeDialog
                            portfolios={allPortfolios}
                            defaultType="sell"
                            initialSymbol={position.symbol}
                        >
                            <Button className="h-14 rounded-2xl font-black gap-2 bg-red-500 hover:bg-red-600 text-white border-none uppercase italic">
                                <TrendingDown size={18} />
                                Vender
                            </Button>
                        </TradeDialog>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
