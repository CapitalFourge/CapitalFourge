"use client";

import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

const TRANSACTIONS_QUERY = gql`
  query GetTransactions {
    portfolios {
      id
      name
      transactions {
        id
        symbol
        type
        quantity
        price
        totalAmount
        timestamp
        balanceTransaction
      }
    }
  }
`;

export default function TransactionsPage() {
    const { data, loading, error } = useQuery(TRANSACTIONS_QUERY);

    if (loading) return <div className="p-10 animate-pulse text-slate-500 font-mono">CARGANDO_TRANSACCIONES...</div>;
    if (error) return <div className="p-10 text-red-500 font-mono">ERROR: {error.message}</div>;

    // Aplanar todas las transacciones de todos los portafolios
    const allTransactions = data?.portfolios?.flatMap((p: any) =>
        p.transactions.map((t: any) => ({ ...t, portfolioName: p.name }))
    ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold tracking-tighter">HISTORIAL_TRANSACCIONES</h1>
                <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">Registros globales de la terminal</p>
            </div>

            <Card className="glass border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <History size={16} /> Registro de Actividad
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="border-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Fecha</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Tipo</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Activo</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Cantidad</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Precio</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Total</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] tracking-widest">Portafolio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-600 italic">
                                        No hay transacciones registradas todavía.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allTransactions.map((tx: any) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-mono text-[12px] text-slate-400">
                                            {new Date(tx.timestamp).toLocaleString("es-ES")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`uppercase text-[9px] font-bold px-2 py-0.5 rounded-full ${tx.type === "BUY" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    tx.type === "SELL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                }`}>
                                                {tx.type === "BUY" ? "COMPRA" : tx.type === "SELL" ? "VENTA" : "EFECTIVO"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-black italic tracking-tighter">{tx.symbol || "---"}</TableCell>
                                        <TableCell className="font-mono">{tx.quantity?.toFixed(4) || "---"}</TableCell>
                                        <TableCell className="font-mono text-white">${tx.price?.toLocaleString() || tx.balanceTransaction?.toLocaleString()}</TableCell>
                                        <TableCell className="font-mono font-bold ${tx.type === 'BUY' ? 'text-red-400' : tx.type === 'SELL' ? 'text-green-400' : 'text-white'}">
                                            ${tx.totalAmount?.toLocaleString() || '--'}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs font-medium uppercase tracking-tighter">{tx.portfolioName}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
