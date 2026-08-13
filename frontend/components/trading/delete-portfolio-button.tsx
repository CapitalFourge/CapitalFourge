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

export function DeletePortfolioButton({ id }: { id: string }) {
    const [deletePortfolio, { loading }] = useMutation(DELETE_PORTFOLIO_MUTATION, {
        refetchQueries: [
          { query: ME_QUERY },
          { query: PORTFOLIOS_QUERY },
          { query: DASHBOARD_QUERY, variables: { sort: "volatile", limit: 8 } },
        ],
        awaitRefetchQueries: true,
        onCompleted: () => {
            toast.success("Estrategia desmantelada correctamente.");
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
