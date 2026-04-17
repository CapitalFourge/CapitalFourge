"use client";

import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { Copy, Globe, History, List, PieChart, Share2, ShoppingCart } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";

import { OrdersDialog } from "@/components/trading/orders-dialog";
import { PositionActionDialog } from "@/components/trading/position-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      isPublic
      shareSlug
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

const TOGGLE_VISIBILITY = gql`
  mutation ToggleVisibility($portfolioId: ID!, $isPublic: Boolean!) {
    toggleVisibility(portfolioId: $portfolioId, isPublic: $isPublic) {
      id
      isPublic
      shareSlug
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
  isPublic: boolean;
  shareSlug?: string;
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

  const [toggleVisibility] = useMutation(TOGGLE_VISIBILITY, {
    refetchQueries: [{ query: PORTFOLIO_DETAIL_QUERY, variables: { id: portfolioId } }]
  });

  if (loading) {
    return <div className="p-8 text-sm uppercase tracking-[0.26em] text-slate-400">Cargando portafolio...</div>;
  }

  if (error || !portfolioId) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar el portafolio</h2>
        <p className="mt-2 text-sm text-red-100/80">{error?.message || "ID de portafolio no encontrado"}</p>
      </div>
    );
  }

  const portfolio = data?.portfolio as Portfolio;
  const userCashBalance = data?.me?.cashBalance || 0;
  const userLockedBalance = data?.me?.lockedBalance || 0;

  const positionsUsdValue =
    portfolio?.positions?.reduce((total: number, position: Position) => {
      return total + position.quantity * (position.currentPrice || 0);
    }, 0) || 0;

  const totalPortfolioValue = userCashBalance + userLockedBalance + positionsUsdValue;
  const totalCostBasis =
    portfolio?.positions?.reduce((total: number, position: Position) => {
      return total + (position.averagePurchasePrice || 0) * position.quantity;
    }, 0) || 0;

  const hasActivePositions = (portfolio?.positions?.length ?? 0) > 0 && totalCostBasis > 0;
  const livePerformance = hasActivePositions ? ((positionsUsdValue - totalCostBasis) / totalCostBasis) * 100 : null;
  const totalPerformance = livePerformance ?? (portfolio?.performance ?? 0);
  return (
    <div className="space-y-6">
      <section className="panel flex flex-col gap-6 p-6 sm:p-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Detalle de cartera</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">{portfolio.name}</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.22em] text-slate-400">ID {portfolio.id.slice(0, 8)}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={async () => {
              try {
                await toggleVisibility({
                  variables: { portfolioId: portfolio.id, isPublic: !portfolio.isPublic }
                });
                toast.success(portfolio.isPublic ? "Cartera ahora es privada" : "Cartera ahora es pública");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
            variant="outline"
            className={`h-11 rounded-2xl border-white/10 transition ${portfolio.isPublic ? "bg-emerald-300/10 text-emerald-300 border-emerald-300/30" : "bg-white/[0.03] text-slate-400"}`}
          >
            {portfolio.isPublic ? <Share2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {portfolio.isPublic ? "Hacer Privada" : "Hacer Pública"}
          </Button>

          {portfolio.isPublic && (
             <Button
               onClick={() => {
                 const url = `${window.location.origin}/share/${portfolio.shareSlug}`;
                 navigator.clipboard.writeText(url);
                 toast.success("Link copiado al portapapeles");
               }}
               variant="outline"
               className="h-11 rounded-2xl border-white/10 bg-white/[0.03] text-slate-200"
             >
               <Copy className="h-4 w-4" />
               Copiar Link
             </Button>
          )}

          <Button
            onClick={() => setOrdersDialogOpen(true)}
            variant="outline"
            className="h-11 rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
          >
            <List className="h-4 w-4" />
            Ver órdenes
          </Button>
          <Button asChild className="h-11 rounded-2xl bg-emerald-300 text-slate-950 hover:bg-emerald-200">
            <Link href="/dashboard">
              <ShoppingCart className="h-4 w-4" />
              Comprar activos
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Valor total</p>
          <p className="mt-4 text-3xl font-semibold text-white">
            ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Rendimiento</p>
          <p className={`mt-4 text-3xl font-semibold ${totalPerformance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {totalPerformance >= 0 ? "+" : ""}
            {totalPerformance.toFixed(2)}%
          </p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Caja</p>
          <p className="mt-4 text-3xl font-semibold text-white">
            ${userCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">En activos</p>
          <p className="mt-4 text-3xl font-semibold text-white">
            ${positionsUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="panel border-white/10 py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <PieChart className="h-5 w-5 text-slate-400" />
              Posiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 pt-2">
            {portfolio.positions.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No hay posiciones abiertas en esta cartera.
              </div>
            ) : (
              portfolio.positions.map((position: Position) => {
                const usdValue = position.quantity * (position.currentPrice || 0);
                const performance =
                  position.averagePurchasePrice > 0 && position.currentPrice > 0
                    ? ((position.currentPrice - position.averagePurchasePrice) / position.averagePurchasePrice) * 100
                    : 0;

                return (
                  <button
                    key={position.symbol}
                    onClick={() => {
                      setSelectedPosition(position);
                      setPositionActionDialogOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="text-lg font-semibold text-white">{position.symbol}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {position.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-white">
                        ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`mt-1 text-xs ${performance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {performance >= 0 ? "+" : ""}
                        {performance.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="panel border-white/10 py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <History className="h-5 w-5 text-slate-400" />
              Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-4 pt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Fecha</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Operación</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Símbolo</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Cantidad</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Precio</TableHead>
                    <TableHead className="pr-6 text-xs uppercase tracking-[0.22em] text-slate-400">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.transactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-6 text-xs text-slate-400">
                        {new Date(transaction.timestamp).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs ${
                            transaction.type === "BUY"
                              ? "border-red-400/20 bg-red-500/10 text-red-100"
                              : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          }`}
                        >
                          {transaction.type === "BUY" ? "Compra" : transaction.type === "SELL" ? "Venta" : transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{transaction.symbol}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">{transaction.quantity}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">${transaction.price?.toLocaleString()}</TableCell>
                      <TableCell className="pr-6 font-mono text-sm font-semibold text-white">
                        ${transaction.totalAmount?.toLocaleString() || "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrdersDialog portfolioId={portfolioId} open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen} />

      <PositionActionDialog
        position={selectedPosition}
        portfolio={portfolio}
        allPortfolios={[portfolio]}
        open={positionActionDialogOpen}
        onOpenChange={setPositionActionDialogOpen}
      />
    </div>
  );
}
