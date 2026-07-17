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

def resolve_yfinance_symbol(symbol: str):
    if symbol in COLOMBIAN_MAP:
        return COLOMBIAN_MAP[symbol]
    for s in LATAM_SUFFIXES:
        try:
            t = yf.Ticker(symbol + s)
            if t.info:
                return symbol + s
        except Exception:
            continue
    return symbol

class PriceOracle:
    def __init__(self):
        host = os.getenv("DB_REDIS_HOST","localhost")
        password = os.getenv("DB_REDIS_PASSWORD", "mi_redis_pass_seguro")
        self.r = redis.Redis(host=host, port=6379, password=password, db=0, decode_responses=True)

    def _get_mock_price(self, symbol: str) -> float:
        """Get mock price for fallback"""
        # Try exact match first
        if symbol in MOCK_PRICES:
            return MOCK_PRICES[symbol]
        # Try base symbol (without suffix)
        base = symbol.split('.')[0].split('-')[0].split('=')[0]
        if base in MOCK_PRICES:
            return MOCK_PRICES[base]
        # Default mock price
        return 100.0

    def fetch_and_cache(self, symbol: str):
        try:
            symbol = resolve_yfinance_symbol(symbol)
            ticker = yf.Ticker(symbol)
            fast_info = ticker.fast_info
            if fast_info is None:
                print(f"Oracle Warning: fast_info is None for {symbol}")
                return self._get_mock_price(symbol)
            
            price = fast_info.get('last_price')
            if price is None:
                # Try alternative method to get price
                hist = ticker.history(period='1d')
                if len(hist) > 0:
                    price = hist.iloc[-1]['Close']
                else:
                    price = None
            
            if price is None:
                print(f"Oracle Warning: Could not fetch price for {symbol}")
                return self._get_mock_price(symbol)
            
            price = float(price)
            # Cache in Redis
            try:
                self.r.set(f"price:{symbol}", price, ex=300)
                update_msg = {
                    "symbol": symbol,
                    "price": price,
                    "timestamp": datetime.now().isoformat()
                }
                self.r.publish("market.prices", json.dumps(update_msg))
            except Exception as redis_e:
                print(f"Oracle Redis Error: {redis_e}")
            
            return price
        except Exception as e:
            print(f"Oracle Error for {symbol}: {e}")
            return self._get_mock_price(symbol)