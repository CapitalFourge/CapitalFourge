"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, gql } from "@apollo/client";
import { Banknote } from "lucide-react";
import { toast } from "sonner";

const DEPOSIT_MUTATION = gql`
  mutation Deposit($amount: Float!) {
    deposit(amount: $amount) {
      id
      cashBalance
    }
  }
`;

const WITHDRAW_MUTATION = gql`
  mutation Withdraw($amount: Float!) {
    withdraw(amount: $amount) {
      id
      cashBalance
    }
  }
`;

export function CashActionDialog({
    initialType = "deposit",
    children,
}: {
    initialType?: "deposit" | "withdraw";
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"deposit" | "withdraw">(initialType);
    const [amount, setAmount] = useState("");

    const [deposit, { loading: depositLoading }] = useMutation(DEPOSIT_MUTATION, {
        onCompleted: () => {
            toast.success("¡Depósito global realizado con éxito!");
            setOpen(false);
            setAmount("");
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en depósito: ${err.message}`)
    });

    const [withdraw, { loading: withdrawLoading }] = useMutation(WITHDRAW_MUTATION, {
        onCompleted: () => {
            toast.success("¡Retiro global realizado con éxito!");
            setOpen(false);
            setAmount("");
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en retiro: ${err.message}`)
    });

    const loading = depositLoading || withdrawLoading;

    const handleAction = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Por favor, ingresa un monto válido.");
            return;
        }

        const variables = {
            amount: parseFloat(amount)
        };

        if (type === "deposit") {
            await deposit({ variables });
        } else {
            await withdraw({ variables });
        }
    };

    return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button variant="outline" className="h-16 rounded-2xl border-white/10 text-white hover:bg-white/5 gap-2 uppercase font-bold">
                        <Banknote className="w-4 h-4" /> {initialType === "deposit" ? "DEPOSITAR" : "RETIRAR"}
                    </Button>
                )}
                </DialogTrigger>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Billetera Global
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
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-2">
                        Los fondos se gestionan a nivel de cuenta global
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Monto (USD)</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-slate-700"
                        />
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
