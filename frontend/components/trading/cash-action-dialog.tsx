"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, gql, useQuery } from "@apollo/client";
import { Banknote, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

const ASSIGN_CASH_MUTATION = gql`
  mutation AssignCash($portfolioId: ID!, $amount: Float!) {
    assignCash(portfolioId: $portfolioId, amount: $amount) {
      id
      allocatedCash
      totalAssigned
      totalWithdrawn
      performance
      totalValue
    }
  }
`;

const WITHDRAW_ASSIGNED_CASH_MUTATION = gql`
  mutation WithdrawAssignedCash($portfolioId: ID!, $amount: Float!) {
    withdrawAssignedCash(portfolioId: $portfolioId, amount: $amount) {
      id
      allocatedCash
      totalAssigned
      totalWithdrawn
      performance
      totalValue
    }
  }
`;

const ME_QUERY = gql`
  query GetMe {
    me {
      id
      cashBalance
      lockedBalance
    }
  }
`;

const PORTFOLIOS_QUERY = gql`
  query GetPortfolios {
    portfolios {
      id
      name
      performance
      shareSlug
      allocatedCash
      lockedCash
      totalAssigned
      totalWithdrawn
      totalValue
      positions {
        id
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
  }
`;

const DASHBOARD_QUERY = gql`
  query GetDashboardData($sort: String!, $limit: Int!) {
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
      shareSlug
      allocatedCash
      totalAssigned
      totalWithdrawn
      totalValue
      positions {
        id
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
    }
    assetMovers(sort: $sort, limit: $limit) {
      topGainers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      topLosers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      mostTraded {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
    }
  }
`;

export function CashActionDialog({
    initialType = "deposit",
    children,
    portfolioId,
}: {
    initialType?: "deposit" | "withdraw";
    children?: React.ReactNode;
    portfolioId: string;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"deposit" | "withdraw">(initialType);
    const [amount, setAmount] = useState("");

    // Fetch user's global cash balance
    const { data: meData, refetch: refetchMe } = useQuery(ME_QUERY);
    // Fetch portfolio data including allocatedCash and lockedCash
    const { data: portfoliosData, refetch: refetchPortfolios } = useQuery(PORTFOLIOS_QUERY);

    const globalCashBalance = meData?.me?.cashBalance ?? 0;
    const portfolio = portfoliosData?.portfolios?.find((p: any) => p.id === portfolioId);
    const allocatedCash = portfolio?.allocatedCash ?? 0;
    const lockedCash = portfolio?.lockedCash ?? 0;
    const availableToWithdraw = allocatedCash - lockedCash; // Available = allocated - locked in pending orders
    const availableToAssign = globalCashBalance;

    const [assignCash, { loading: assignLoading }] = useMutation(ASSIGN_CASH_MUTATION, {
        refetchQueries: [
          { query: ME_QUERY },
          { query: PORTFOLIOS_QUERY },
          { query: DASHBOARD_QUERY, variables: { sort: "volatile", limit: 8 } },
        ],
        awaitRefetchQueries: true,
        onCompleted: () => {
            toast.success("¡Fondos asignados al portafolio con éxito!");
            setOpen(false);
            setAmount("");
        },
        onError: (err) => toast.error(`Error al asignar fondos: ${err.message}`)
    });

    const [withdrawAssignedCash, { loading: withdrawLoading }] = useMutation(WITHDRAW_ASSIGNED_CASH_MUTATION, {
        refetchQueries: [
          { query: ME_QUERY },
          { query: PORTFOLIOS_QUERY },
          { query: DASHBOARD_QUERY, variables: { sort: "volatile", limit: 8 } },
        ],
        awaitRefetchQueries: true,
        onCompleted: () => {
            toast.success("¡Fondos retirados del portafolio con éxito!");
            setOpen(false);
            setAmount("");
        },
        onError: (err) => toast.error(`Error al retirar fondos: ${err.message}`)
    });

    const loading = assignLoading || withdrawLoading;

    const handleAction = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Por favor, ingresa un monto válido.");
            return;
        }

        const maxAllowed = type === "deposit" ? availableToAssign : availableToWithdraw;
        if (Number(amount) > maxAllowed) {
            toast.error(`${type === "deposit" ? "Saldo global insuficiente" : "Fondos disponibles insuficientes en portafolio"}. Máx: $${maxAllowed.toFixed(2)}`);
            return;
        }

        const variables = {
            portfolioId,
            amount: parseFloat(amount)
        };

        if (type === "deposit") {
            await assignCash({ variables });
        } else {
            await withdrawAssignedCash({ variables });
        }
    };

    return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-white hover:bg-white/5 gap-2 uppercase font-bold">
                        <Banknote className="w-4 h-4" /> {initialType === "deposit" ? "ASIGNAR" : "RETIRAR"}
                    </Button>
                )}
                </DialogTrigger>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Gestionar Fondos del Portafolio
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
                    <button
                        onClick={() => setType("deposit")}
                        className={`flex-1 py-2 rounded-md transition-all text-sm font-bold ${type === "deposit" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
                    >
                        ASIGNAR
                    </button>
                    <button
                        onClick={() => setType("withdraw")}
                        className={`flex-1 py-1 rounded-md transition-all text-sm font-bold ${type === "withdraw" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
                    >
                        RETIRAR
                    </button>
                </div>

                <div className="space-y-4 py-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-2">
                        Asigna o retira fondos de este portafolio desde tu saldo global
                    </p>
                    
                    {/* Available balance info - single card */}
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-2">
                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                            <Info className="w-3 h-3" />
                            <span>Disponible para {type === "deposit" ? "asignar" : "retirar"}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${(type === "deposit" ? availableToAssign : availableToWithdraw).toFixed(2)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            {type === "deposit" 
                                ? `Saldo global: $${globalCashBalance.toFixed(2)}`
                                : `Caja en portafolio: $${allocatedCash.toFixed(2)} (bloqueado en órdenes: $${lockedCash.toFixed(2)})`}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Monto (USD)</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-slate-700"
                            max={type === "deposit" ? availableToAssign : availableToWithdraw}
                            step="0.01"
                        />
                        {Number(amount) > (type === "deposit" ? availableToAssign : availableToWithdraw) && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Excede el máximo disponible (${(type === "deposit" ? availableToAssign : availableToWithdraw).toFixed(2)})
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleAction}
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-widest"
                    >
                        {loading ? "PROCESANDO..." : `CONFIRMAR ${type === "deposit" ? "ASIGNACIÓN" : "RETIRO"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}