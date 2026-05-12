"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, gql } from "@apollo/client";
import { ShoppingCart, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { SymbolAutocomplete } from "@/components/trading/symbol-autocomplete";

const BUY_ASSET_MUTATION = gql`
  mutation BuyAsset($portfolioId: ID!, $symbol: String!, $quantity: Float!, $price: Float!) {
    buyAsset(portfolioId: $portfolioId, symbol: $symbol, quantity: $quantity, price: $price) {
      id
    }
  }
`;

const SELL_ASSET_MUTATION = gql`
  mutation SellAsset($portfolioId: ID!, $symbol: String!, $quantity: Float!, $price: Float!) {
    sellAsset(portfolioId: $portfolioId, symbol: $symbol, quantity: $quantity, price: $price) {
      id
    }
  }
`;

const BUY_ASSET_BY_USD_MUTATION = gql`
  mutation BuyAssetByUSD($portfolioId: ID!, $symbol: String!, $usdAmount: Float!, $price: Float!) {
    buyAssetByUSD(portfolioId: $portfolioId, symbol: $symbol, usdAmount: $usdAmount, price: $price) {
      id
    }
  }
`;

const SELL_ASSET_BY_USD_MUTATION = gql`
  mutation SellAssetByUSD($portfolioId: ID!, $symbol: String!, $usdAmount: Float!, $price: Float!) {
    sellAssetByUSD(portfolioId: $portfolioId, symbol: $symbol, usdAmount: $usdAmount, price: $price) {
      id
    }
  }
`;

const CREATE_LIMIT_ORDER_MUTATION = gql`
  mutation CreateLimitOrder(
    $portfolioId: ID!
    $type: OrderType!
    $symbol: String!
    $targetPrice: Float!
    $quantity: Float
    $usdAmount: Float
  ) {
    createLimitOrder(
      portfolioId: $portfolioId
      type: $type
      symbol: $symbol
      targetPrice: $targetPrice
      quantity: $quantity
      usdAmount: $usdAmount
    ) {
      id
      status
    }
  }
`;

const STOCK_PRICE_QUERY = gql`
  query StockPrice($symbol: String!) {
    stockPrice(symbol: $symbol) {
      symbol
      price
    }
  }
`;

interface Position {
    symbol: string;
    quantity: number;
    averagePurchasePrice: number;
    currentPrice?: number;
}

interface Portfolio {
    id: string;
    name: string;
    positions: Position[];
}

interface TradeVariables {
    portfolioId: string;
    symbol: string;
    price?: number;
    quantity?: number;
    usdAmount?: number;
    targetPrice?: number;
    type?: string;
}

interface TradeDialogProps {
    portfolios: Portfolio[];
    defaultType?: "buy" | "sell";
    portfolioPositions?: Map<string, Position[]>;
    initialSymbol?: string;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TradeDialog({ portfolios, defaultType = "buy", portfolioPositions, initialSymbol = "", children, open = false, onOpenChange }: TradeDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [type, setType] = useState<"buy" | "sell">(defaultType);
    const [orderType, setOrderType] = useState<"market" | "limit">("market");
    const [tradingMode, setTradingMode] = useState<"quantity" | "usd">("quantity");

    // Control open state from props or internal state
    const isControlled = open !== undefined;
    const dialogOpen = isControlled ? open : internalOpen;
    const setDialogOpen = isControlled ? (() => {}) : setInternalOpen;

    // Sync internal open state with prop changes
    useEffect(() => {
        if (!isControlled) {
            setInternalOpen(open);
        }
    }, [open]);

    // Form state
    const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || "");
    const [symbol, setSymbol] = useState(initialSymbol);
    const [quantity, setQuantity] = useState("");
    const [usdAmount, setUsdAmount] = useState("");
    const [price, setPrice] = useState("");

    // priceType is derived from orderType: market orders use market price, limit orders use custom price
    const priceType = orderType === "market" ? "market" : "custom";

    // Query for current stock price
    const { data: priceData, refetch: refetchPrice } = useQuery(STOCK_PRICE_QUERY, {
        variables: { symbol },
        skip: !symbol || priceType !== "market",
        fetchPolicy: "network-only",
    });

    // Update price when market price is fetched (FIXED BUG)
    // Removed setPrice from useEffect to avoid cascading renders
    const effectivePrice = useMemo(() => {
        if (priceType === "market" && priceData?.stockPrice) {
            return priceData.stockPrice.price.toString();
        }
        return price;
    }, [priceData, priceType, price]);

    // Real-time calculation
    const calculatedQuantity = useMemo(() => {
        if (tradingMode === "usd" && effectivePrice && usdAmount) {
            return (parseFloat(usdAmount) / parseFloat(effectivePrice)).toFixed(8);
        }
        return quantity;
    }, [tradingMode, effectivePrice, usdAmount, quantity]);

    const calculatedUSD = useMemo(() => {
        if (tradingMode === "quantity" && effectivePrice && quantity) {
            return (parseFloat(quantity) * parseFloat(effectivePrice)).toFixed(2);
        }
        return usdAmount;
    }, [tradingMode, effectivePrice, quantity, usdAmount]);

    const [buyAsset, { loading: buyLoading }] = useMutation(BUY_ASSET_MUTATION, {
        onCompleted: () => {
            toast.success("¡Compra ejecutada con éxito!");
            setOpen(false);
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en compra: ${err.message}`)
    });

    const [sellAsset, { loading: sellLoading }] = useMutation(SELL_ASSET_MUTATION, {
        onCompleted: () => {
            toast.success("¡Venta ejecutada con éxito!");
            setOpen(false);
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en venta: ${err.message}`)
    });

    const [buyAssetByUSD, { loading: buyLoadingUSD }] = useMutation(BUY_ASSET_BY_USD_MUTATION, {
        onCompleted: () => {
            toast.success("¡Compra ejecutada con éxito!");
            setOpen(false);
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en compra: ${err.message}`)
    });

    const [sellAssetByUSD, { loading: sellLoadingUSD }] = useMutation(SELL_ASSET_BY_USD_MUTATION, {
        onCompleted: () => {
            toast.success("¡Venta ejecutada con éxito!");
            setOpen(false);
            window.location.reload();
        },
        onError: (err) => toast.error(`Error en venta: ${err.message}`)
    });

    const [createLimitOrder, { loading: limitOrderLoading }] = useMutation(CREATE_LIMIT_ORDER_MUTATION, {
        onCompleted: () => {
            toast.success("Orden límite creada exitosamente");
            setOpen(false);
            window.location.reload();
        },
        onError: (err) => toast.error(`Error creando orden: ${err.message}`)
    });

    const loading = buyLoading || sellLoading || buyLoadingUSD || sellLoadingUSD || limitOrderLoading;

    const handleTrade = async () => {
        if (!portfolioId || !symbol || !effectivePrice) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }

        const variables: TradeVariables = {
            portfolioId,
            symbol,
            price: parseFloat(effectivePrice),
        };

        if (orderType === "market") {
            // Execute market order
            if (type === "buy") {
                if (tradingMode === "quantity") {
                    if (!quantity) {
                        toast.error("Por favor, ingresa la cantidad.");
                        return;
                    }
                    variables.quantity = parseFloat(quantity);
                    await buyAsset({ variables });
                } else {
                    if (!usdAmount) {
                        toast.error("Por favor, ingresa el monto USD.");
                        return;
                    }
                    variables.usdAmount = parseFloat(usdAmount);
                    await buyAssetByUSD({ variables });
                }
            } else {
                if (tradingMode === "quantity") {
                    if (!quantity) {
                        toast.error("Por favor, ingresa la cantidad.");
                        return;
                    }
                    variables.quantity = parseFloat(quantity);
                    await sellAsset({ variables });
                } else {
                    if (!usdAmount) {
                        toast.error("Por favor, ingresa el monto USD.");
                        return;
                    }
                    variables.usdAmount = parseFloat(usdAmount);
                    await sellAssetByUSD({ variables });
                }
            }
        } else {
            // Create limit order
            if (tradingMode === "quantity") {
                if (!quantity) {
                    toast.error("Por favor, ingresa la cantidad.");
                    return;
                }
                variables.quantity = parseFloat(quantity);
            } else {
                if (!usdAmount) {
                    toast.error("Por favor, ingresa el monto USD.");
                    return;
                }
                variables.usdAmount = parseFloat(usdAmount);
            }
            variables.type = type === "buy" ? "BUY_LIMIT" : "SELL_LIMIT";
            variables.targetPrice = parseFloat(effectivePrice);
            await createLimitOrder({ variables });
        }
    };

    const handleSymbolChange = (value: string) => {
        setSymbol(value.toUpperCase());
        if (orderType === "market" && value) {
            refetchPrice();
        }
    };

    // Get current portfolio positions
    const currentPortfolioPositions = useMemo(() => {
        return portfolioPositions?.get(portfolioId) || [];
    }, [portfolioPositions, portfolioId]);

    // Debug logging
    useEffect(() => {
        console.log("[DEBUG TradeDialog] type:", type);
        console.log("[DEBUG TradeDialog] portfolioId:", portfolioId);
    }, [type, portfolioId, portfolioPositions, currentPortfolioPositions]);

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className={`h-16 rounded-2xl font-bold gap-2 ${defaultType === "buy" ? "bg-white text-black hover:bg-slate-200" : "bg-transparent border-white/10 hover:bg-white/5 text-white"`}>
                        <>
                            {defaultType === "buy" ? <ShoppingCart className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {defaultType === "buy" ? "COMPRAR" : "VENDER"}
                        </>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass border-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic">
                        Inicializar Operación
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
                    <button
                        onClick={() => setType("buy")}
                        className={type === "buy" ? "flex-1 py-2 rounded-md transition-all text-sm font-bold bg-white text-black" : "flex-1 py-2 rounded-md transition-all text-sm font-bold text-slate-400 hover:text-white"}>
                        COMPRA
                    </button>
                    <button
                        onClick={() => setType("sell")}
                        className={type === "sell" ? "flex-1 py-1 rounded-md transition-all text-sm font-bold bg-white text-black" : "flex-1 py-1 rounded-md transition-all text-sm font-bold text-slate-400 hover:text-white"}>
                        VENTA
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-slate-500">Símbolo (Ticker)</label>
                            {type === "sell" ? (
                                <div className="space-y-2">
                                    <select
                                        value={symbol}
                                        onChange={(e) => {
                                            handleSymbolChange(e.target.value);
                                            setQuantity(""); // Reset quantity when asset changes
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                        <option value="">Seleccionar activo...</option>
                                        {currentPortfolioPositions.length > 0 ? (
                                            currentPortfolioPositions.map((pos: Position) => (
                                                <option key={pos.symbol} value={pos.symbol}>
                                                    {pos.symbol} ({pos.quantity.toFixed(8).replace(/\.?0+$/, '')} disponibles)
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                No hay activos disponibles en este portafolio
                                            </option>
                                        )}
                                    </select>
                                    {symbol && currentPortfolioPositions.length > 0 && (() => {
                                        const position = currentPortfolioPositions.find((pos: Position) => pos.symbol === symbol);
                                        if (position) {
                                            return (
                                                <p className="text-[10px] text-slate-500">
                                                    Máx. disponible: {position.quantity.toFixed(8).replace(/\.?0+$/, '')} {symbol}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                    {currentPortfolioPositions.length === 0 && (
                                        <p className="text-[10px] text-orange-400">
                                            Este portafolio no tiene activos para vender
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <SymbolAutocomplete
                                    value={symbol}
                                    onChange={handleSymbolChange}
                                    placeholder="AAPL, BTC, etc"
                                    inputClassName="w-full"
                                >
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-slate-500">
                                {tradingMode === "quantity" ? "Cantidad" : "Monto USD"}
                            </label>
                            <Input
                                type="number"
                                placeholder={tradingMode === "quantity" ? "0.00" : "0.00"}
                                     ? 'Valor total: $' + calculatedUSD
                                         : 'Cantidad estimada: ' + calculatedQuantity}
                                className="bg-black/40 border-white/10 text-white"
                            >
                            {price && (tradingMode === "quantity" ? quantity : usdAmount) && (
                                <p className="text-[10px] text-slate-500">
                                    {tradingMode === "quantity"
                                     ? 'Valor total: $' + calculatedUSD
                                         : 'Cantidad estimada: ' + calculatedQuantity}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-500">
                            {orderType === "market" ? "Precio de Mercado ($)" : "Precio Objetivo ($)"}
                        </label>
                        <Input
                            type="number"
                            placeholder={orderType === "market" ? "Cargando precio..." : "0.00"}
                            value={effectivePrice}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={orderType === "market"}
                            className="bg-black/40 border-white/10 text-white"
                        >
                        {orderType === "market" && priceData?.stockPrice && (
                            <p className="text-[10px] text-slate-500">
                                Último precio actualizado: ${priceData.stockPrice.price?.toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
                
                <DialogFooter className="sm:justify-start">
                    <Button
                        onClick={handleTrade}
                        disabled={loading}
                        className={"w-full font-bold uppercase tracking-widest " + (orderType === "market" ? (type === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") : "bg-blue-500 hover:bg-blue-600") + " text-white"}>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}