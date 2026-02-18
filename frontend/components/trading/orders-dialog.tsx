"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, gql } from "@apollo/client";
import { toast } from "sonner";

const GET_ORDERS_QUERY = gql`
    query GetOrders($portfolioId: ID!) {
        ordersByPortfolio(portfolioId: $portfolioId) {
            id
            type
            symbol
            targetPrice
            quantity
            usdAmount
            status
            createdAt
            expiresAt
            filledPrice
            filledQuantity
        }
    }
`;

const CANCEL_ORDER_MUTATION = gql`
    mutation CancelOrder($orderId: ID!) {
        cancelOrder(orderId: $orderId) {
            id
            status
        }
    }
`;

interface OrdersDialogProps {
    portfolioId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrdersDialog({ portfolioId, open, onOpenChange }: OrdersDialogProps) {
    const { data, refetch } = useQuery(GET_ORDERS_QUERY, {
        variables: { portfolioId },
        skip: !open
    });

    const [cancelOrder] = useMutation(CANCEL_ORDER_MUTATION, {
        onCompleted: () => {
            toast.success("Orden cancelada");
            refetch();
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const handleCancel = (orderId: string) => {
        cancelOrder({ variables: { orderId } });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-500";
            case "FILLED": return "bg-green-500";
            case "CANCELLED": return "bg-red-500";
            case "EXPIRED": return "bg-gray-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-none text-white sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Órdenes Limitadas
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {data?.ordersByPortfolio?.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">
                            No hay órdenes activas
                        </p>
                    ) : (
                        data?.ordersByPortfolio?.map((order: any) => (
                            <div key={order.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            order.type === "BUY_LIMIT" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                        }`}>
                                            {order.type === "BUY_LIMIT" ? "COMPRA" : "VENTA"}
                                        </span>
                                        <span className="ml-2 font-bold">{order.symbol}</span>
                                    </div>
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-slate-500">Precio objetivo:</span>
                                        <span className="ml-2">${order.targetPrice?.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Cantidad:</span>
                                        <span className="ml-2">{order.quantity || order.usdAmount}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Creada:</span>
                                        <span className="ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Expira:</span>
                                        <span className="ml-2">{new Date(order.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {order.status === "PENDING" && (
                                    <Button
                                        onClick={() => handleCancel(order.id)}
                                        variant="outline"
                                        className="mt-3 w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    >
                                        Cancelar Orden
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
