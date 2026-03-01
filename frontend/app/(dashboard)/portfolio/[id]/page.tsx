"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { History, PieChart, List, ShoppingCart, ArrowUpRight } from "lucide-react";
import { OrdersDialog } from "@/components/trading/orders-dialog";
import { PositionActionDialog } from "@/components/trading/position-action-dialog";

const PORTFOLIO_DETAIL_QUERY = gql`
  query GetPortfolioDetail($id: ID!) {
    me {
      id
      cashBalance
      lockedBalance
    }
    portfolio(id: $id) {
      id
      name
      performance
      positions {
        symbol
        quantity
        currentPrice
        averagePurchasePrice
      }
      transactions {
        id
        symbol
        type
        quantity
        price
        totalAmount
        timestamp
      }
    }
  }
`;

interface Position {
    symbol: string;
    quantity: number;
    currentPrice: number;
    averagePurchasePrice: number;
}

interface Transaction {
    id: string;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
    totalAmount: number;
    timestamp: string;
}

interface Portfolio {
    id: string;
    name: string;
    performance: number;
    positions: Position[];
    transactions: Transaction[];
}

export default function PortfolioDetailPage() {
    const { id } = useParams();
    const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [positionActionDialogOpen, setPositionActionDialogOpen] = useState(false);
    const portfolioId = Array.isArray(id) ? id[0] : id;
    const { data, loading, error } = useQuery(PORTFOLIO_DETAIL_QUERY, {
        variables: { id: portfolioId },
    });

    if (loading) return <div className="p-10 animate-pulse text-slate-500 font-mono">CARGANDO_PORTAFOLIO_{portfolioId}...</div>;
    if (error) return <div className="p-10 text-red-500 font-mono">ERROR: {error.message}</div>;
    if (!portfolioId) return <div className="p-10 text-red-500 font-mono">ERROR: Portfolio ID not found</div>;

    const portfolio = data?.portfolio as Portfolio;
    const userCashBalance = data?.me?.cashBalance || 0;
    const userLockedBalance = data?.me?.lockedBalance || 0;

    // Calculate total portfolio value (cash + assets) using currentPrice from GraphQL
    const positionsUsdValue = portfolio?.positions?.reduce((total: number, pos: Position) => {
        const currentPrice = pos.currentPrice || 0;
        return total + (pos.quantity * currentPrice);
    }, 0) || 0;
    const totalPortfolioValue = userCashBalance + userLockedBalance + positionsUsdValue;

    // Calculate total cost basis and performance using averagePurchasePrice from GraphQL
    const totalCostBasis = portfolio?.positions?.reduce((total: number, pos: Position) => {
        const avgCost = pos.averagePurchasePrice || 0;
        return total + (avgCost * pos.quantity);
    }, 0) || 0;
    // If there are active positions, calculate live performance; otherwise fall back to
    // the backend's stored historical performance (same value shown on the portfolio list page)
    const hasActivePositions = (portfolio?.positions?.length ?? 0) > 0 && totalCostBasis > 0;
    const livePerformance = hasActivePositions ? ((positionsUsdValue - totalCostBasis) / totalCostBasis) * 100 : null;
    const totalPerformance = livePerformance ?? (portfolio?.performance ?? 0);
    const totalPerformanceUsd = hasActivePositions ? positionsUsdValue - totalCostBasis : 0;
    const performanceColor = totalPerformance >= 0 ? "text-emerald-400" : "text-red-400";
    const performanceSign = totalPerformance >= 0 ? "↑" : "↓";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter uppercase">{portfolio.name}</h1>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest">ID: {portfolio.id.substring(0, 8)}... // Terminal_Scope: Local</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setOrdersDialogOpen(true)}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5"
                    >
                        <List size={16} className="mr-2" />
                        Ver Órdenes
                    </Button>
                    <Button asChild className="bg-white text-black hover:bg-slate-200">
                        <Link href="/dashboard">
                            <ShoppingCart size={16} className="mr-2" />
                            Comprar Activos
                        </Link>
                    </Button>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Valor_Total_Portafolio</p>
                        <p className="text-4xl font-black text-white font-mono italic">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="flex items-center justify-end gap-4 mt-2">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-right">Rendimiento</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <p className={`text-lg font-bold font-mono ${performanceColor}`}>
                                        ${Math.abs(totalPerformanceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-sm font-bold font-mono ${performanceColor} bg-white/5 px-2 py-0.5 rounded-lg`}>
                                        {performanceSign} {Math.abs(totalPerformance).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                            <div className="border-l border-slate-700 pl-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Saldo_Efectivo</p>
                                <p className="text-lg font-bold text-slate-300 font-mono">${userCashBalance.toLocaleString()}</p>
                            </div>
                            <div className="border-l border-slate-700 pl-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bloqueado</p>
                                <p className="text-lg font-bold text-orange-400 font-mono">${userLockedBalance.toLocaleString()}</p>
                            </div>
                            <div className="border-l border-slate-700 pl-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">En_Activos</p>
                                <p className="text-lg font-bold text-emerald-400 font-mono">${positionsUsdValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="glass border-none lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <PieChart size={14} /> Posiciones_Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {portfolio.positions.length === 0 ? (
                            <p className="text-slate-600 text-sm italic py-4 text-center">Sin posiciones abiertas.</p>
                        ) : (
                            portfolio.positions.map((pos: Position) => {
                                const currentPrice = pos.currentPrice || 0;
                                const avgCost = pos.averagePurchasePrice || 0;
                                const usdValue = pos.quantity * currentPrice;
                                const hasPrice = currentPrice > 0;
                                const hasCost = avgCost > 0;
                                const performance = hasCost && hasPrice ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
                                const perfColor = performance >= 0 ? "text-emerald-400" : "text-red-400";
                                const perfSign = performance >= 0 ? "↑" : "↓";

                                return (
                                    <div
                                        key={pos.symbol}
                                        onClick={() => {
                                            setSelectedPosition(pos);
                                            setPositionActionDialogOpen(true);
                                        }}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xs italic">
                                                {pos.symbol.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">{pos.symbol}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">En cartera</p>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="font-mono font-bold text-sm text-slate-400">
                                                {pos.quantity}
                                            </div>
                                            <div className={`font-mono font-bold text-xs ${hasPrice ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            {hasCost && (
                                                <div className={`font-mono text-[10px] ${perfColor}`}>
                                                    {perfSign} {Math.abs(performance).toFixed(2)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card className="glass border-none lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <History size={14} /> Registro_de_Transacciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="border-white/5">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Fecha</TableHead>
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Operación</TableHead>
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Símbolo</TableHead>
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Cant.</TableHead>
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Precio</TableHead>
                                    <TableHead className="text-slate-500 uppercase text-[9px] tracking-widest">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolio.transactions.map((tx: Transaction) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="text-[10px] text-slate-500 font-mono">
                                            {new Date(tx.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`uppercase text-[8px] font-bold ${tx.type === "BUY" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                tx.type === "SELL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                    tx.type === "DEPOSIT" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                        tx.type === "WITHDRAWAL" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                            tx.type === "CANCELLED" ? "bg-red-500/20 text-red-500 border-red-500/40 font-bold italic" :
                                                                tx.type === "EXPIRED" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 font-mono" :
                                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                                }`}>
                                                {tx.type === "BUY" ? "COMPRA" :
                                                    tx.type === "SELL" ? "VENTA" :
                                                        tx.type === "DEPOSIT" ? "DEPÓSITO" :
                                                            tx.type === "WITHDRAWAL" ? "RETIRO" :
                                                                tx.type === "CANCELLED" ? "CANCELADA" :
                                                                    tx.type === "EXPIRED" ? "EXPIRADA" : tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-xs italic">{tx.symbol}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.quantity}</TableCell>
                                        <TableCell className="font-mono text-xs text-white">${tx.price?.toLocaleString()}</TableCell>
                                        <TableCell className={`font-mono text-xs font-bold ${tx.type === 'BUY' ? 'text-red-400' :
                                            tx.type === 'CANCELLED' || tx.type === 'EXPIRED' ? 'text-slate-500 line-through' :
                                                'text-green-400'}`}>
                                            ${tx.totalAmount?.toLocaleString() || '--'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <OrdersDialog
                portfolioId={portfolioId}
                open={ordersDialogOpen}
                onOpenChange={setOrdersDialogOpen}
            />

            <PositionActionDialog
                position={selectedPosition}
                portfolio={portfolio}
                allPortfolios={[portfolio]} // In this page we focus on current portfolio
                open={positionActionDialogOpen}
                onOpenChange={setPositionActionDialogOpen}
            />
        </div>
    );
}