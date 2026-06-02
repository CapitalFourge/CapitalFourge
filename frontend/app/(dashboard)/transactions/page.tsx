"use client";

import { gql, useQuery } from "@apollo/client";
import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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

interface Transaction {
  id: string;
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  balanceTransaction?: number;
  portfolioName?: string;
}

interface Portfolio {
  id: string;
  name: string;
  transactions: Transaction[];
}

export default function TransactionsPage() {
  const { data, loading, error } = useQuery(TRANSACTIONS_QUERY);

  if (loading) {
    return <div className="p-8 text-sm uppercase tracking-[0.26em] text-slate-400">Cargando movimientos...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar las transacciones</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  const allTransactions =
    data?.portfolios
      ?.flatMap((portfolio: Portfolio) =>
        portfolio.transactions.map((transaction: Transaction) => ({
          ...transaction,
          portfolioName: portfolio.name,
        }))
      )
      .sort((a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  const badgeClass = (type: string) => {
    if (type === "BUY") return "bg-red-500/10 text-red-200 border-red-400/20";
    if (type === "SELL") return "bg-emerald-300/10 text-emerald-100 border-emerald-300/20";
    return "bg-sky-300/10 text-sky-100 border-sky-300/20";
  };

  const label = (type: string) => {
    if (type === "BUY") return "Compra";
    if (type === "SELL") return "Venta";
    return "Efectivo";
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Registro operativo</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Transacciones.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Consolida compras, ventas y movimientos de efectivo en una sola tabla operativa.
            </p>
          </div>
          <InfoTooltip
            title="Movimientos"
            description="Aquí se registran todas tus compras, ventas y movimientos de efectivo (recargas y retiros). Cada entrada tiene fecha, tipo, activo, cantidad, precio y total."
          />
        </div>
      </section>

      <Card className="panel border-white/10 py-0">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <History className="h-5 w-5 text-slate-400" />
            Historial reciente
          </CardTitle>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            {allTransactions.length} registros
          </span>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Fecha</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Tipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Activo</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Cantidad</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Precio</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Total</TableHead>
                  <TableHead className="pr-6 text-xs uppercase tracking-[0.22em] text-slate-400">Portafolio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                      Todavía no hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  allTransactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-6 font-mono text-xs text-slate-400">
                        {new Date(transaction.timestamp).toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${badgeClass(transaction.type)} rounded-full px-3 py-1 text-xs font-medium`}>
                          {label(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{transaction.symbol || "--"}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">
                        {transaction.quantity?.toFixed(4) || "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">
                        ${transaction.price?.toLocaleString() || transaction.balanceTransaction?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-white">
                        ${transaction.totalAmount?.toLocaleString() || "--"}
                      </TableCell>
                      <TableCell className="pr-6 text-sm text-slate-400">{transaction.portfolioName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
