"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, gql } from "@apollo/client";
import { Banknote } from "lucide-react";
import { toast } from "sonner";

const ADD_CASH_MUTATION = gql`
  mutation AddCash($portfolioId: ID!, $amount: Float!) {
    addCash(portfolioId: $portfolioId, amount: $amount) {
      id
      balance
    }
  }
`;

const WITHDRAW_CASH_MUTATION = gql`
  mutation WithdrawCash($portfolioId: ID!, $amount: Float!) {
    withdrawCash(portfolioId: $portfolioId, amount: $amount) {
      id
      balance
    }
  }
`;

export function CashActionDialog({ portfolios, initialType = "deposit" }: { portfolios: any[], initialType?: "deposit" | "withdraw" }) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"deposit" | "withdraw">(initialType);
    const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || "");
    const [amount, setAmount] = useState("");

    const [addCash, { loading: addLoading }] = useMutation(ADD_CASH_MUTATION, {
        onCompleted: () => {
            toast.success("¡Depósito realizado con éxito!");
            setOpen(false);
            setAmount("");
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en depósito: ${err.message}`)
    });

    const [withdrawCash, { loading: withdrawLoading }] = useMutation(WITHDRAW_CASH_MUTATION, {
        onCompleted: () => {
            toast.success("¡Retiro realizado con éxito!");
            setOpen(false);
            setAmount("");
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en retiro: ${err.message}`)
    });

    const loading = addLoading || withdrawLoading;

    const handleAction = async () => {
        if (!portfolioId) {
            toast.error("Por favor, selecciona un portafolio.");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error("Por favor, ingresa un monto válido.");
            return;
        }

        const selectedPortfolio = portfolios.find((p: any) => p.id === portfolioId);
        const currentBalance = selectedPortfolio?.balance || 0;

        if (type === "withdraw" && Number(amount) > currentBalance) {
            toast.error(`Saldo insuficiente. Balance actual: $${currentBalance.toLocaleString()}`);
            return;
        }

        const variables = {
            portfolioId,
            amount: parseFloat(amount)
        };

        if (type === "deposit") {
            await addCash({ variables });
        } else {
            await withdrawCash({ variables });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-white hover:bg-white/5 gap-2 uppercase font-bold">
                    <Banknote className="w-4 h-4" /> {initialType === "deposit" ? "DEPOSITAR" : "RETIRAR"}
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Transferencia de Fondos
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
                    <button
                        onClick={() => setType("deposit")}
                        className={`flex-1 py-2 rounded-md transition-all text-sm font-bold ${type === "deposit" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
                    >
                        DEPÓSITO
                    </button>
                    <button
                        onClick={() => setType("withdraw")}
                        className={`flex-1 py-1 rounded-md transition-all text-sm font-bold ${type === "withdraw" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
                    >
                        RETIRO
                    </button>
                </div>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Portafolio</label>
                        <select
                            value={portfolioId}
                            onChange={(e) => setPortfolioId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        >
                            {portfolios.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name || `Estrategia_${p.id.substring(0, 4)}`} - Balance: ${p.balance?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Monto (USD)</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-slate-700"
                        />
                        {type === "withdraw" && portfolioId && (
                            <p className="text-[10px] text-slate-500">
                                Balance disponible: ${portfolios.find((p: any) => p.id === portfolioId)?.balance?.toLocaleString() || 0}
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
                        {loading ? "PROCESANDO..." : `CONFIRMAR ${type === "deposit" ? "DEPÓSITO" : "RETIRO"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
