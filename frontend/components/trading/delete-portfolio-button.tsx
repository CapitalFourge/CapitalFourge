"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, gql } from "@apollo/client";
import { toast } from "sonner";

const DELETE_PORTFOLIO_MUTATION = gql`
  mutation DeletePortfolio($id: ID!) {
    deletePortfolio(id: $id)
  }
`;

export function DeletePortfolioButton({ id }: { id: string }) {
    const [deletePortfolio, { loading }] = useMutation(DELETE_PORTFOLIO_MUTATION, {
        onCompleted: () => {
            toast.success("Estrategia desmantelada correctamente.");
            window.location.reload();
        },
        onError: (err) => toast.error(`Error al eliminar: ${err.message}`)
    });

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("¿Estás seguro de que deseas desmantelar esta estrategia? Se perderán todos los datos.")) return;

        await deletePortfolio({
            variables: { id }
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    );
}
