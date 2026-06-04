import yfinance as yf

COLOMBIAN_MAP = {
    'EC': 'ECOL.BOG', 'ECOPETROL': 'ECOL.BOG',
    'AVAL': 'AVAL.BOG',
    'BANCOLOMBIA': 'BANCOLOMBIA.BOG', 'BANCO': 'BANCOLOMBIA.BOG',
    'PF': 'PFAVAL.BOG',
    'CEMEX': 'CEMEX.BOG',
}

LATAM_SUFFIXES = ['.BOG', '.CL', '.MX', '.SA', '.AR', '.PE']

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

import redis
import os
import json

from datetime import datetime

class PriceOracle:
    def __init__(self):
        host = os.getenv("DB_REDIS_HOST","localhost")
        password = os.getenv("DB_REDIS_PASSWORD", "mi_redis_pass_seguro")
        self.r = redis.Redis(host=host, port=6379, password=password, db=0, decode_responses=True)

    def fetch_and_cache(self, symbol: str):
        try:
            symbol = resolve_yfinance_symbol(symbol)
            ticker = yf.Ticker(symbol)
            fast_info = ticker.fast_info
            if fast_info is None:
                print(f"Oracle Warning: fast_info is None for {symbol}")
                return 0.0
            
            price = fast_info.get('last_price')
            if price is None:
                # Try alternative method to get price
                price = ticker.history(period='1d').iloc[-1]['Close'] if len(ticker.history(period='1d')) > 0 else None
            
            if price is None:
                print(f"Oracle Warning: Could not fetch price for {symbol}")
                return 0.0
            
            self.r.set(f"price:{symbol}", price, ex=300)
            update_msg = {
                "symbol": symbol,
                "price": price,
                "timestamp": datetime.now().isoformat()
            }
            self.r.publish("market.prices", json.dumps(update_msg))
            return float(price)
        except Exception as e:
            print(f"Oracle Error for {symbol}: {e}")
            return 0.0