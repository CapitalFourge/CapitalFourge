'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { gql, useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndicatorSelector } from '@/components/trading/indicator-selector';
import { TradingViewChart } from '@/components/trading/tradingview-chart';
import { FundamentalMetricSelector } from '@/components/trading/fundamental-metric-selector';
import { TradeDialog } from '@/components/trading/trade-dialog';
import { FundamentalPricePoint } from '@/lib/types/fundamental-price-point';
import { useIndicators } from '@/app/(dashboard)/explorer/[symbol]/components/useIndicators';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Position {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice?: number;
}

interface PortfolioData {
  id: string;
  name: string;
  performance: number;
  positions: Position[];
}

interface Order {
  id: string;
  type: string;
  symbol: string;
  targetPrice: number;
  quantity: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

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

// Use existing backend query that returns all pending limit orders for current user
const PENDING_LIMIT_ORDERS_QUERY = gql`
  query GetPendingLimitOrders {
    pendingLimitOrders {
      id
      type
      symbol
      targetPrice
      quantity
      status
      createdAt
      expiresAt
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

const ASSET_DATA_QUERY = gql`
  query GetAssetData($symbol: String!) {
    asset(symbol: $symbol) {
      symbol
      name
      category
      description
      website
      price
      change24h
      changePercent24h
      volume24h
    }
    priceHistory(symbol: $symbol, days: 365) {
      ... on StockPricePoint {
        timestamp
        open
        high
        low
        close
        volume
        date
        marketCap
        trailingPe
        forwardPe
        pegRatio
        priceToBook
        priceToSales
        enterpriseToEbitda
        profitMargins
        operatingMargins
        returnOnEquity
        returnOnAssets
        debtToEquity
        currentRatio
        quickRatio
        dividendYield
        freeCashFlow
      }
      ... on CryptoPricePoint {
        timestamp
        open
        high
        low
        close
        volume
        date
        marketCap
        circulatingSupply
        totalSupply
        maxSupply
        inflationRate
        fdv
        activeAddresses
        transactionVolume
        transactionCount
        feesGenerated
        tvl
        hashRate
        stakingRatio
        nakamotoCoefficient
        orderBookDepth
        developerActivity
        userGrowth
        revenue
        priceToFeesRatio
        bitcoinDominance
        fearGreedIndex
      }
      ... on CommodityPricePoint {
        timestamp
        open
        high
        low
        close
        volume
        date
        marketCap
        inventoryLevels
        costOfProduction
        allInSustainingCost
        reserveReplacementRatio
        contangoBackwardation
        dollarIndexExposure
        inflationCorrelation
        opecSpareCapacity
        chineseDemandIndex
        weatherIndex
      }
      ... on ForexPricePoint {
        timestamp
        open
        high
        low
        close
        volume
        date
        marketCap
      }
    }
  }
`;

// Limit Orders Dialog Component
function LimitOrdersDialog({ symbol, orders, open, onOpenChange }: { 
  symbol: string; 
  orders: Order[]; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const [cancelOrder] = useMutation(CANCEL_ORDER_MUTATION, {
    refetchQueries: [{ query: PENDING_LIMIT_ORDERS_QUERY }],
    awaitRefetchQueries: true,
  });

  const symbolOrders = orders.filter(o => o.symbol === symbol && o.status === 'PENDING');
  
  if (symbolOrders.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Badge variant="default" className="bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-pointer">
          {symbolOrders.length} orden{symbolOrders.length !== 1 ? 'es' : ''} límite pendiente{symbolOrders.length !== 1 ? 's' : 'e'}
        </Badge>
      </DialogTrigger>
      <DialogContent className="glass border-none text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tighter uppercase italic flex items-center gap-2">
            <AlertCircle className="text-amber-400" size={20} />
            Órdenes Límite Pendientes
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <p className="text-sm text-slate-300">
            Tienes {symbolOrders.length} orden{symbolOrders.length !== 1 ? 'es' : ''} límite pendiente{symbolOrders.length !== 1 ? 's' : ''} para {symbol}:
          </p>
          <div className="space-y-3">
            {symbolOrders.map((order) => (
              <div key={order.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${order.type === "BUY_LIMIT" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {order.type === "BUY_LIMIT" ? "COMPRA" : "VENTA"}
                    </span>
                    <span className="ml-2 font-bold">{order.symbol}</span>
                  </div>
                  <Badge className="bg-yellow-500">{order.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Precio objetivo:</span>
                    <span className="ml-2">${order.targetPrice?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cantidad:</span>
                    <span className="ml-2">{order.quantity}</span>
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
                <Button
                  onClick={() => cancelOrder({ variables: { orderId: order.id } })}
                  variant="outline"
                  className="mt-3 w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  size="sm"
                >
                  Cancelar Orden
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showFundamental, setShowFundamental] = useState<boolean>(false);
  const [activeFundamentals, setActiveFundamentals] = useState<string[]>([]);
  const [selectedInterval] = useState<string>('1D');
  const [limitOrdersOpen, setLimitOrdersOpen] = useState(false);

  // Initialize localStorage values after mount (avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIndicators = localStorage.getItem(`asset-${symbol}-indicators`);
      if (storedIndicators) setActiveIndicators(JSON.parse(storedIndicators));
      
      const storedFundamentals = localStorage.getItem(`asset-${symbol}-fundamentals`);
      if (storedFundamentals) setActiveFundamentals(JSON.parse(storedFundamentals));
    }
  }, [symbol]);

  // Persist indicators selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`asset-${symbol}-indicators`, JSON.stringify(activeIndicators));
    }
  }, [symbol, activeIndicators]);

  // Persist fundamentals selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`asset-${symbol}-fundamentals`, JSON.stringify(activeFundamentals));
    }
  }, [symbol, activeFundamentals]);

  // Fetch portfolios for trade dialog
  const { data: portfoliosData } = useQuery(PORTFOLIOS_QUERY);
  const portfolios: PortfolioData[] = portfoliosData?.portfolios || [];

  // Fetch pending limit orders for current user
  const { data: pendingOrdersData } = useQuery(PENDING_LIMIT_ORDERS_QUERY);

  // Build portfolio positions map for trade dialog
  const portfolioPositions = useMemo(() => {
    const map = new Map<string, Position[]>();
    portfolios.forEach((portfolio: { id: string; positions: Position[] }) => {
      map.set(portfolio.id, portfolio.positions || []);
    });
    return map;
  }, [portfolios]);

  // Check if user has positions for this symbol - build detailed info
  const positionDetails = useMemo(() => {
    const details: { portfolioId: string; portfolioName: string; quantity: number }[] = [];
    portfolios.forEach(p => {
      p.positions?.forEach(pos => {
        if (pos.symbol === symbol) {
          details.push({
            portfolioId: p.id,
            portfolioName: p.name,
            quantity: pos.quantity
          });
        }
      });
    });
    return details;
  }, [portfolios, symbol]);

  const hasPosition = positionDetails.length > 0;

  // Check for limit orders for this symbol
  const hasLimitOrders = useMemo(() => {
    if (!pendingOrdersData) return false;
    return pendingOrdersData.pendingLimitOrders?.some((o: Order) => o.symbol === symbol && o.status === 'PENDING');
  }, [pendingOrdersData, symbol]);

  const pendingOrders = pendingOrdersData?.pendingLimitOrders || [];

  const { data, loading, error } = useQuery(ASSET_DATA_QUERY, {
    variables: { symbol: symbol },
    pollInterval: 30000,
  });
  const asset = data?.asset;
  const priceHistory = useMemo(() => data?.priceHistory || [], [data?.priceHistory]);
  const latestFundamental = priceHistory[priceHistory.length - 1] as typeof priceHistory[0] | undefined;

  const fullChartData = useMemo(() => {
    return priceHistory
      .map((point: FundamentalPricePoint) => ({
        date: point.date,
        open: point.open || point.close,
        high: point.high || point.close,
        low: point.low || point.close,
        close: point.close,
        volume: point.volume || 0,
      }))
      .filter((point: { date: string; close: number }) => !Number.isNaN(Date.parse(point.date)) && point.close > 0);
  }, [priceHistory]);

  const latestDailyPoint = useMemo(() => fullChartData[fullChartData.length - 1], [fullChartData]);
  const previousDailyPoint = useMemo(() => fullChartData[fullChartData.length - 2], [fullChartData]);

  useIndicators({ priceHistory: priceHistory as FundamentalPricePoint[], activeIndicators });

  if (loading && !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Cargando activo...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-5 text-red-100">
          No fue posible cargar el activo: {error.message}
        </div>
      </div>
    );
  }

  if (!asset) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Activo no encontrado.</div>;
  }

  const latestPrice = asset?.price
    ? `$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (latestDailyPoint
        ? `$${latestDailyPoint.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00');

  const change24h = asset?.changePercent24h
    ? `${asset.changePercent24h >= 0 ? '+' : ''}${asset.changePercent24h.toFixed(2)}%`
    : (latestDailyPoint && previousDailyPoint
        ? `${(((latestDailyPoint.close - previousDailyPoint.close) / previousDailyPoint.close) * 100).toFixed(2)}%`
        : '0.00%');

  const volume24h = asset?.volume24h
    ? asset.volume24h.toLocaleString(undefined)
    : (latestDailyPoint ? latestDailyPoint.volume.toLocaleString(undefined) : '0');
  const marketCap = latestFundamental?.marketCap
      ? `$${latestFundamental.marketCap.toLocaleString(undefined)}`
      : 'N/A';

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-black/50">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <Button variant="outline" onClick={() => { window.history.back(); }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al explorador
        </Button>
        <div className="flex items-center gap-4">
          <TradeDialog
            portfolios={portfolios}
            defaultType="buy"
            portfolioPositions={portfolioPositions}
            initialSymbol={symbol}
          >
            <Button variant="default" className="text-sm px-4 py-2">Comprar</Button>
          </TradeDialog>
          <TradeDialog
            portfolios={portfolios}
            defaultType="sell"
            portfolioPositions={portfolioPositions}
            initialSymbol={symbol}
          >
            <Button variant="destructive" className="text-sm px-4 py-2">Vender</Button>
          </TradeDialog>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-bold text-white">{asset.symbol}</h1>
              <span className="text-xl font-light text-slate-300">{asset.name}</span>
            </div>
            <span className="text-sm text-slate-400">{asset.category}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Precio actual</p>
              <p className="mt-1 text-xl font-semibold text-white">{latestPrice}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cambio 24h</p>
              <p className="mt-1 text-lg font-semibold {asset?.change24h !== undefined && asset.change24h !== null ? (asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400') : (latestDailyPoint && previousDailyPoint && latestDailyPoint.close > previousDailyPoint.close ? 'text-emerald-400' : 'text-rose-400')}">
                {change24h}
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Volumen 24h</p>
              <p className="mt-1 text-lg font-semibold text-white">{volume24h}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-white/[0.03] rounded-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Market Cap</p>
              <p className="mt-1 text-lg font-semibold text-white">{marketCap}</p>
            </div>
          </div>

          {/* Position & Limit Order Status */}
          <div className="flex flex-wrap items-center gap-3">
            {hasPosition && (
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {positionDetails.map(d => `${d.quantity} ${symbol} en ${d.portfolioName}`).join(', ')}
              </Badge>
            )}
            {hasLimitOrders && (
              <LimitOrdersDialog
                symbol={symbol}
                orders={pendingOrders}
                open={limitOrdersOpen}
                onOpenChange={setLimitOrdersOpen}
              />
            )}
            {!hasPosition && !hasLimitOrders && (
              <Badge variant="outline" className="border-slate-500/30 text-slate-400">
                Sin posición ni órdenes pendientes
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant={showIndicators ? 'default' : 'outline'}
              onClick={() => setShowIndicators(!showIndicators)}
              className="flex items-center gap-2"
            >
              <IndicatorIcon className="h-4 w-4" />
              Indicadores técnicos ({activeIndicators.length})
            </Button>
            <Button
              variant={showFundamental ? 'default' : 'outline'}
              onClick={() => setShowFundamental(!showFundamental)}
              className="flex items-center gap-2"
            >
              <FundamentalIcon className="h-4 w-4" />
              Fundamentales ({activeFundamentals.length})
            </Button>
          </div>

          <TradingViewChart
            symbol={symbol}
            interval={selectedInterval}
            indicators={activeIndicators}
          />

          {showIndicators && (
            <IndicatorSelector
              selectedIndicators={activeIndicators}
              onChange={setActiveIndicators}
            />
          )}

          {showFundamental && (
            <FundamentalMetricSelector
              selectedMetrics={activeFundamentals}
              onChange={setActiveFundamentals}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Información del activo</h3>
            {asset.description && (
              <div className="prose prose-invert max-w-none">
                <p>{asset.description}</p>
              </div>
            )}

            {/* Asset Info Cards - Key metrics below description - show ONLY selected fundamentals */}
                        {latestFundamental && activeFundamentals.length > 0 && (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {activeFundamentals.map((metricId) => {
                              const metric = latestFundamental[metricId as keyof typeof latestFundamental];
                              const isAvailable = metric !== undefined && metric !== null && metric !== 0;
                 
                              // Format based on metric type
                              let displayValue: string;
                              if (!isAvailable) {
                                displayValue = 'Información no disponible';
                              } else if (['profitMargins', 'operatingMargins', 'returnOnEquity', 'returnOnAssets', 'dividendYield'].includes(metricId)) {
                                displayValue = `${(metric * 100).toFixed(2)}%`;
                              } else if (['marketCap', 'freeCashFlow', 'revenue'].includes(metricId)) {
                                displayValue = `$${metric.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                              } else {
                                displayValue = metric.toFixed(2);
                              }

                              // Get label from catalog
                              const labels: Record<string, string> = {
                                'marketCap': 'Market Cap',
                                'trailingPe': 'P/E (Trailing)',
                                'forwardPe': 'P/E (Forward)',
                                'pegRatio': 'PEG Ratio',
                                'priceToBook': 'Price/Book',
                                'priceToSales': 'Price/Sales',
                                'enterpriseToEbitda': 'EV/EBITDA',
                                'profitMargins': 'Profit Margin',
                                'operatingMargins': 'Operating Margin',
                                'returnOnEquity': 'ROE',
                                'returnOnAssets': 'ROA',
                                'debtToEquity': 'Debt/Equity',
                                'currentRatio': 'Current Ratio',
                                'quickRatio': 'Quick Ratio',
                                'dividendYield': 'Dividend Yield',
                                'freeCashFlow': 'Free Cash Flow',
                                'revenue': 'Revenue',
                              };

                              return (
                                <div key={metricId} className="panel-muted rounded-xl p-4">
                                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    {labels[metricId] || metricId}
                                  </p>
                                  <p className="mt-1 text-xl font-semibold text-white">
                                    {displayValue}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {latestFundamental && activeFundamentals.length === 0 && (
                          <p className="text-slate-400 text-sm">Selecciona métricas en &ldquo;Fundamentales&rdquo; para verlas aquí</p>
                        )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IndicatorIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>;
}

function FundamentalIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8Z" />
  </svg>;
}