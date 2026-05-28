"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, gql } from "@apollo/client";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const CREATE_PORTFOLIO_MUTATION = gql`
  mutation CreatePortfolio($name: String!, $description: String) {
    createPortfolio(name: $name, description: $description) {
      id
      name
    }
  }
`;

export function CreatePortfolioDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [createPortfolio, { loading }] = useMutation(CREATE_PORTFOLIO_MUTATION, {
        onCompleted: () => {
            toast.success("¡Portafolio inicializado correctamente!");
            setOpen(false);
            setName("");
            setDescription("");
            window.location.reload();
        },
        onError: (err) => toast.error(`Fallo en despliegue: ${err.message}`)
    });

    const handleCreate = async () => {
        if (!name) {
            toast.error("El nombre del workspace es obligatorio.");
            return;
        }
        await createPortfolio({
            variables: { name, description }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-slate-200 font-bold gap-2 rounded-2xl h-12">
                    <Plus className="w-5 h-5" /> NUEVA ESTRATEGIA
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Inicializar Workspace
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Nombre de la Estrategia</label>
                        <Input
                            placeholder="Ej: Crecimiento_Agresivo_H1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-slate-700 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Descripción (Opcional)</label>
                        <Input
                            placeholder="Detalles sobre el motor de ejecución..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-slate-700 rounded-xl"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-widest h-12 rounded-xl"
                    >
                        {loading ? "INICIALIZANDO..." : "DESPLEGAR ESTRATEGIA"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
