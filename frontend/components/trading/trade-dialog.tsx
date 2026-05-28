"use client";

import { useEffect, useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { ShoppingCart, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { SymbolAutocomplete } from "@/components/trading/symbol-autocomplete";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

const formatQuantity = (value: number) => value.toFixed(8).replace(/\.?0+$/, "");

export function TradeDialog({
  portfolios,
  defaultType = "buy",
  portfolioPositions,
  initialSymbol = "",
  children,
  open,
  isOpen,
  onClose,
  onOpenChange,
}: TradeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<"buy" | "sell">(defaultType);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [tradingMode, setTradingMode] = useState<"quantity" | "usd">("quantity");
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id ?? "");
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [price, setPrice] = useState("");

  const controlledOpen = isOpen ?? open;
  const dialogOpen = controlledOpen ?? internalOpen;

  const setDialogState = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  };

  useEffect(() => {
    if (!portfolioId && portfolios[0]?.id) {
      setPortfolioId(portfolios[0].id);
    }
  }, [portfolioId, portfolios]);

  useEffect(() => {
    setType(defaultType);
  }, [defaultType]);

  useEffect(() => {
    setSymbol(initialSymbol);
  }, [initialSymbol]);

  const currentPortfolioPositions = useMemo(
    () => portfolioPositions?.get(portfolioId) ?? portfolios.find((portfolio) => portfolio.id === portfolioId)?.positions ?? [],
    [portfolioId, portfolioPositions, portfolios],
  );

  const { data: priceData, loading: priceLoading, refetch: refetchPrice } = useQuery(STOCK_PRICE_QUERY, {
    variables: { symbol },
    skip: !symbol || orderType !== "market",
    fetchPolicy: "network-only",
  });

  const effectivePrice = useMemo(() => {
    if (orderType === "market" && priceData?.stockPrice?.price) {
      return String(priceData.stockPrice.price);
    }
    return price;
  }, [orderType, price, priceData?.stockPrice?.price]);

  const calculatedQuantity = useMemo(() => {
    if (tradingMode === "usd" && effectivePrice && usdAmount) {
      return (parseFloat(usdAmount) / parseFloat(effectivePrice)).toFixed(8);
    }
    return quantity;
  }, [effectivePrice, quantity, tradingMode, usdAmount]);

  const calculatedUSD = useMemo(() => {
    if (tradingMode === "quantity" && effectivePrice && quantity) {
      return (parseFloat(quantity) * parseFloat(effectivePrice)).toFixed(2);
    }
    return usdAmount;
  }, [effectivePrice, quantity, tradingMode, usdAmount]);

  const resetForm = () => {
    setQuantity("");
    setUsdAmount("");
    if (orderType === "limit") {
      setPrice("");
    }
  };

  const handleCompleted = (message: string) => {
    toast.success(message);
    setDialogState(false);
    resetForm();
    window.location.reload();
  };

  const handleError = (message: string) => (err: Error) => {
    toast.error(`${message}: ${err.message}`);
  };

  const [buyAsset, { loading: buyLoading }] = useMutation(BUY_ASSET_MUTATION, {
    onCompleted: () => handleCompleted("Compra ejecutada con exito"),
    onError: handleError("Error en compra"),
  });

  const [sellAsset, { loading: sellLoading }] = useMutation(SELL_ASSET_MUTATION, {
    onCompleted: () => handleCompleted("Venta ejecutada con exito"),
    onError: handleError("Error en venta"),
  });

  const [buyAssetByUSD, { loading: buyUSDLoading }] = useMutation(BUY_ASSET_BY_USD_MUTATION, {
    onCompleted: () => handleCompleted("Compra ejecutada con exito"),
    onError: handleError("Error en compra"),
  });

  const [sellAssetByUSD, { loading: sellUSDLoading }] = useMutation(SELL_ASSET_BY_USD_MUTATION, {
    onCompleted: () => handleCompleted("Venta ejecutada con exito"),
    onError: handleError("Error en venta"),
  });

  const [createLimitOrder, { loading: limitOrderLoading }] = useMutation(CREATE_LIMIT_ORDER_MUTATION, {
    onCompleted: () => handleCompleted("Orden limite creada con exito"),
    onError: handleError("Error creando orden"),
  });

  const loading = buyLoading || sellLoading || buyUSDLoading || sellUSDLoading || limitOrderLoading;

  const handleSymbolChange = (value: string) => {
    const nextSymbol = value.toUpperCase();
    setSymbol(nextSymbol);
    if (orderType === "market" && nextSymbol) {
      refetchPrice({ symbol: nextSymbol });
    }
  };

  const handleTrade = async () => {
    if (!portfolioId || !symbol || !effectivePrice) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    const parsedPrice = parseFloat(effectivePrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("El precio no es valido.");
      return;
    }

    const variables: TradeVariables = {
      portfolioId,
      symbol,
      price: parsedPrice,
    };

    if (tradingMode === "quantity") {
      if (!quantity || parseFloat(quantity) <= 0) {
        toast.error("Ingresa una cantidad valida.");
        return;
      }
      variables.quantity = parseFloat(quantity);
    } else {
      if (!usdAmount || parseFloat(usdAmount) <= 0) {
        toast.error("Ingresa un monto USD valido.");
        return;
      }
      variables.usdAmount = parseFloat(usdAmount);
    }

    if (orderType === "limit") {
      variables.type = type === "buy" ? "BUY_LIMIT" : "SELL_LIMIT";
      variables.targetPrice = parsedPrice;
      await createLimitOrder({ variables });
      return;
    }

    if (type === "buy") {
      if (tradingMode === "quantity") {
        await buyAsset({ variables: variables as Required<Pick<TradeVariables, "portfolioId" | "symbol" | "price" | "quantity">> });
      } else {
        await buyAssetByUSD({ variables: variables as Required<Pick<TradeVariables, "portfolioId" | "symbol" | "price" | "usdAmount">> });
      }
      return;
    }

    if (tradingMode === "quantity") {
      await sellAsset({ variables: variables as Required<Pick<TradeVariables, "portfolioId" | "symbol" | "price" | "quantity">> });
    } else {
      await sellAssetByUSD({ variables: variables as Required<Pick<TradeVariables, "portfolioId" | "symbol" | "price" | "usdAmount">> });
    }
  };

  const actionLabel =
    orderType === "limit"
      ? type === "buy"
        ? "Crear compra limite"
        : "Crear venta limite"
      : type === "buy"
        ? "Comprar ahora"
        : "Vender ahora";

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogState}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            className={
              defaultType === "buy"
                ? "h-16 rounded-2xl gap-2 bg-white font-bold text-black hover:bg-slate-200"
                : "h-16 rounded-2xl gap-2 border border-white/10 bg-transparent font-bold text-white hover:bg-white/5"
            }
          >
            {defaultType === "buy" ? <ShoppingCart className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {defaultType === "buy" ? "COMPRAR" : "VENDER"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="glass border-none text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Inicializar operacion</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={
                type === "buy"
                  ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  : "rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              }
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={
                type === "sell"
                  ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  : "rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              }
            >
              Venta
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Portafolio</label>
              <select
                value={portfolioId}
                onChange={(event) => setPortfolioId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              >
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Tipo de orden</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("market")}
                  className={
                    orderType === "market"
                      ? "rounded-xl bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-200"
                      : "rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-400"
                  }
                >
                  Mercado
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("limit")}
                  className={
                    orderType === "limit"
                      ? "rounded-xl bg-sky-300/15 px-3 py-2 text-sm font-medium text-sky-200"
                      : "rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-400"
                  }
                >
                  Limite
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Simbolo</label>
            {type === "sell" && currentPortfolioPositions.length > 0 ? (
              <select
                value={symbol}
                onChange={(event) => handleSymbolChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Seleccionar activo...</option>
                {currentPortfolioPositions.map((position) => (
                  <option key={position.symbol} value={position.symbol}>
                    {position.symbol} ({formatQuantity(position.quantity)} disponibles)
                  </option>
                ))}
              </select>
            ) : (
              <SymbolAutocomplete
                value={symbol}
                onChange={handleSymbolChange}
                placeholder="AAPL, BTC, ETH..."
                inputClassName="rounded-xl"
              />
            )}
            {type === "sell" && currentPortfolioPositions.length === 0 && (
              <p className="text-[11px] text-orange-300">Este portafolio no tiene activos disponibles para vender.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Modo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTradingMode("quantity")}
                  className={
                    tradingMode === "quantity"
                      ? "rounded-xl bg-white px-3 py-2 text-sm font-medium text-black"
                      : "rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-400"
                  }
                >
                  Cantidad
                </button>
                <button
                  type="button"
                  onClick={() => setTradingMode("usd")}
                  className={
                    tradingMode === "usd"
                      ? "rounded-xl bg-white px-3 py-2 text-sm font-medium text-black"
                      : "rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-400"
                  }
                >
                  USD
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {tradingMode === "quantity" ? "Cantidad" : "Monto USD"}
              </label>
              <Input
                type="number"
                value={tradingMode === "quantity" ? quantity : usdAmount}
                onChange={(event) =>
                  tradingMode === "quantity" ? setQuantity(event.target.value) : setUsdAmount(event.target.value)
                }
                placeholder="0.00"
                className="border-white/10 bg-black/40 text-white"
              />
              {effectivePrice && (quantity || usdAmount) && (
                <p className="text-[11px] text-slate-500">
                  {tradingMode === "quantity"
                    ? `Valor estimado: $${calculatedUSD}`
                    : `Cantidad estimada: ${calculatedQuantity}`}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {orderType === "market" ? "Precio de mercado" : "Precio objetivo"}
            </label>
            <Input
              type="number"
              value={effectivePrice}
              onChange={(event) => setPrice(event.target.value)}
              disabled={orderType === "market"}
              placeholder={orderType === "market" ? "Cargando precio..." : "0.00"}
              className="border-white/10 bg-black/40 text-white disabled:opacity-70"
            />
            {orderType === "market" && (
              <p className="text-[11px] text-slate-500">
                {priceLoading && symbol ? "Consultando ultimo precio..." : priceData?.stockPrice?.price ? `Ultimo precio: $${priceData.stockPrice.price.toLocaleString()}` : "Selecciona un simbolo para cargar el precio."}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleTrade}
            disabled={loading || !portfolios.length}
            className={
              type === "buy"
                ? "w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
                : "w-full bg-rose-500 font-semibold text-white hover:bg-rose-600"
            }
          >
            {loading ? "Procesando..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
