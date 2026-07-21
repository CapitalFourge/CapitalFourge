import yfinance as yf
import redis
import os
import json

from datetime import datetime

COLOMBIAN_MAP = {
    'EC': 'ECOL.BOG', 'ECOPETROL': 'ECOL.BOG',
    'AVAL': 'AVAL.BOG',
    'BANCOLOMBIA': 'BANCOLOMBIA.BOG', 'BANCO': 'BANCOLOMBIA.BOG',
    'PF': 'PFAVAL.BOG',
    'CEMEX': 'CEMEX.BOG',
}

LATAM_SUFFIXES = ['.BOG', '.CL', '.MX', '.SA', '.AR', '.PE']

# Mock prices para fallback cuando yfinance falla
MOCK_PRICES = {
    'AAPL': 182.50, 'MSFT': 378.90, 'GOOGL': 138.20, 'AMZN': 145.60,
    'TSLA': 248.50, 'NVDA': 875.30, 'META': 312.40, 'NFLX': 485.60,
    'AMD': 158.90, 'ADBE': 512.30, 'CRM': 267.80, 'INTC': 43.20,
    'BTC-USD': 67250.00, 'ETH-USD': 3450.00, 'SOL-USD': 145.80,
    'ADA-USD': 0.485, 'DOT-USD': 7.25, 'XRP-USD': 0.525,
    'GC=F': 2340.50, 'SI=F': 28.90, 'CL=F': 78.50, 'NG=F': 2.85,
    'EURUSD=X': 1.085, 'GBPUSD=X': 1.265, 'USDJPY=X': 149.80,
    'EC': 1850.00, 'AVAL': 920.00, 'BANCOLOMBIA': 28500.00,
    'PF': 1250.00, 'CEMEX': 890.00,
}

# Symbols that should NOT have suffixes tried (already have standard format)
NO_SUFFIX_PATTERNS = (
    '-USD', '-EUR', '-GBP',  # Crypto
    '=F', '=X',              # Commodities, Forex
)

def resolve_yfinance_symbol(symbol: str):
    """Resolve symbol for yfinance - avoid adding suffixes to known formats"""
    # 1. Colombian stocks
    if symbol in COLOMBIAN_MAP:
        return COLOMBIAN_MAP[symbol]
    
    # 2. Don't try suffixes for symbols that already have standard format
    for pattern in NO_SUFFIX_PATTERNS:
        if symbol.endswith(pattern):
            return symbol
    
    # 3. For regular stocks, try LATAM suffixes
    for s in LATAM_SUFFIXES:
        try:
            t = yf.Ticker(symbol + s)
            if t.info:
                return symbol + s
        except Exception:
            continue
    
    # 4. Return original symbol
    return symbol

class PriceOracle:
    def __init__(self):
        host = os.getenv("DB_REDIS_HOST","localhost")
        password = os.getenv("DB_REDIS_PASSWORD", "mi_redis_pass_seguro")
        self.r = redis.Redis(host=host, port=6379, password=password, db=0, decode_responses=True)

    def _get_mock_price(self, symbol: str) -> float:
        """Get mock price for fallback - try exact match first"""
        if symbol in MOCK_PRICES:
            return MOCK_PRICES[symbol]
        # Try base symbol (for suffixed symbols like BTC-USD.BOG -> BTC-USD)
        base = symbol.split('.')[0].split('-')[0].split('=')[0]
        if base in MOCK_PRICES:
            return MOCK_PRICES[base]
        # Default mock price
        return 100.0

    def fetch_and_cache(self, symbol: str):
        try:
            resolved_symbol = resolve_yfinance_symbol(symbol)
            ticker = yf.Ticker(resolved_symbol)
            fast_info = ticker.fast_info
            if fast_info is None:
                raise RuntimeError(f"fast_info is None for {resolved_symbol}")
            
            price = fast_info.get('last_price')
            if price is None:
                # Try alternative method to get price
                hist = ticker.history(period='1d')
                if len(hist) > 0:
                    price = hist.iloc[-1]['Close']
                else:
                    price = None
            
            if price is None:
                raise RuntimeError(f"Could not fetch price for {resolved_symbol}")
            
            price = float(price)
            # Cache in Redis using resolved symbol
            try:
                self.r.set(f"price:{resolved_symbol}", price, ex=300)
                update_msg = {
                    "symbol": resolved_symbol,
                    "price": price,
                    "timestamp": datetime.now().isoformat()
                }
                self.r.publish("market.prices", json.dumps(update_msg))
            except Exception as redis_e:
                print(f"Oracle Redis Error: {redis_e}")
            
            return price
        except Exception as e:
            # NO FALLBACK - propagate error so we know when data source fails
            print(f"Oracle Error for {symbol}: {e}")
            raise