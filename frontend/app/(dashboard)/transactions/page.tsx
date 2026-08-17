"use client";

import { gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { History, AlertCircle } from "lucide-react";

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

const PENDING_LIMIT_ORDERS_QUERY = gql`
  query GetPendingLimitOrders {
    pendingLimitOrders {
      id
      type
      symbol
      targetPrice
      quantity
      status
      createdAt
      expiresAt
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

interface Order {
  id: string;
  type: string;
  symbol: string;
  targetPrice: number;
  quantity: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Portfolio {
  id: string;
  name: string;
  transactions: Transaction[];
}

export default function TransactionsPage() {
  const { data, loading, error } = useQuery(TRANSACTIONS_QUERY);
  const { data: ordersData, loading: ordersLoading } = useQuery(PENDING_LIMIT_ORDERS_QUERY);

  if (loading || ordersLoading) {
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

  // Add pending limit orders as "pending transactions"
  const pendingOrders = ordersData?.pendingLimitOrders
    ?.filter((o: Order) => o.status === 'PENDING')
    ?.map((o: Order) => ({
      id: o.id,
      symbol: o.symbol,
      type: o.type === 'BUY_LIMIT' ? 'BUY_LIMIT' : 'SELL_LIMIT',
      quantity: o.quantity,
      price: o.targetPrice,
      totalAmount: o.targetPrice * o.quantity,
      timestamp: o.createdAt,
      portfolioName: 'Orden límite',
      isPending: true,
    })) || [];

  const allItems = [...allTransactions, ...pendingOrders]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const badgeClass = (type: string) => {
    if (type === "BUY") return "bg-red-500/10 text-red-200 border-red-400/20";
    if (type === "SELL") return "bg-emerald-300/10 text-emerald-100 border-emerald-300/20";
    if (type === "BUY_LIMIT") return "bg-amber-500/10 text-amber-200 border-amber-400/20";
    if (type === "SELL_LIMIT") return "bg-orange-500/10 text-orange-200 border-orange-400/20";
    return "bg-sky-300/10 text-sky-100 border-sky-300/20";
  };

  const label = (type: string) => {
    if (type === "BUY") return "Compra";
    if (type === "SELL") return "Venta";
    if (type === "BUY_LIMIT") return "Compra límite";
    if (type === "SELL_LIMIT") return "Venta límite";
    return "Efectivo";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <div className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <div className="flex items-center gap-3">
            <p className="eyebrow">Registro operativo</p>
            <InfoTooltip
              title="Movimientos"
              description="Aquí se registran todas tus compras, ventas, movimientos de efectivo y órdenes límite pendientes. Cada entrada tiene fecha, tipo, activo, cantidad, precio y total."
            />
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Transacciones.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Consolida compras, ventas, movimientos de efectivo y órdenes pendientes en una sola tabla operativa.
          </p>
        </div>
      </div>

      <Card className="panel border-white/10 py-0">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <History className="h-5 w-5 text-slate-400" />
            Historial reciente
          </CardTitle>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            {allItems.length} registros
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
                {allItems.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                      Todavía no hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  allItems.map((item: Transaction & { isPending?: boolean }) => (
                    <TableRow key={item.id} className={`border-white/10 hover:bg-white/[0.03] ${item.isPending ? 'bg-amber-500/5' : ''}`}>
                      <TableCell className="px-6 font-mono text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${badgeClass(item.type)} rounded-full px-3 py-1 text-xs font-medium ${item.isPending ? 'animate-pulse' : ''}`}>
                          {label(item.type)}
                          {item.isPending && <AlertCircle className="ml-1 h-3 w-3" />}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{item.symbol || "--"}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">
                        {item.quantity?.toFixed(4) || "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">
                        ${item.price?.toLocaleString() || item.balanceTransaction?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-white">
                        ${item.totalAmount?.toLocaleString() || "--"}
                      </TableCell>
                      <TableCell className="pr-6 text-sm text-slate-400">{item.portfolioName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
