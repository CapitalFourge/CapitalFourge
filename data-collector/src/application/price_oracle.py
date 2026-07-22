import yfinance as yf
import redis
import os
import json
from typing import Optional

from datetime import datetime

COLOMBIAN_MAP = {
    'EC': 'ECOL.BOG', 'ECOPETROL': 'ECOL.BOG',
    'AVAL': 'AVAL.BOG',
    'BANCOLOMBIA': 'BANCOLOMBIA.BOG', 'BANCO': 'BANCOLOMBIA.BOG',
    'PF': 'PFAVAL.BOG',
    'CEMEX': 'CEMEX.BOG',
}

LATAM_SUFFIXES = ['.BOG', '.CL', '.MX', '.SA', '.AR', '.PE']

# Symbols that should NOT have suffixes tried (already have standard format)
NO_SUFFIX_PATTERNS = (
    '-USD', '-EUR', '-GBP',  # Crypto
    '=F', '=X',              # Commodities, Forex
)

# Global singleton instance
_price_oracle_instance = None

def get_price_oracle(
    redis_upstash_url: Optional[str] = None,
    redis_local_host: str = "localhost",
    redis_local_password: str = "mi_redis_pass_seguro",
    connect_local: bool = True,
    allow_no_redis: bool = False
) -> 'PriceOracle':
    """Get or create the global PriceOracle singleton."""
    global _price_oracle_instance
    if _price_oracle_instance is None:
        _price_oracle_instance = PriceOracle(
            redis_upstash_url=redis_upstash_url,
            redis_local_host=redis_local_host,
            redis_local_password=redis_local_password,
            connect_local=connect_local,
            allow_no_redis=allow_no_redis
        )
    return _price_oracle_instance

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
    """Price oracle that publishes to BOTH Redis instances:
    - Upstash (Capital Fourge production)
    - Local Redis (Trading Bot on VPS) - OPTIONAL, only if available
    """
    
    def __init__(
        self, 
        redis_upstash_url: Optional[str] = None,  # SPRING_REDIS_URL from Render
        redis_local_host: str = "localhost",
        redis_local_password: str = "mi_redis_pass_seguro",
        connect_local: bool = True,  # Set False on Render
        allow_no_redis: bool = False  # Allow running without Redis (for Render deploy)
    ):
        # Upstash Redis (Capital Fourge) - optional
        self.r_upstash = None
        if redis_upstash_url:
            try:
                self.r_upstash = redis.from_url(redis_upstash_url, decode_responses=True)
                self.r_upstash.ping()
                print("✅ Connected to Upstash Redis (Capital Fourge)")
            except Exception as e:
                print(f"⚠️ Upstash Redis connection failed: {e}")
                self.r_upstash = None
        
        # Local Redis (Trading Bot) - optional, only if connect_local=True
        self.r_local = None
        if connect_local:
            try:
                self.r_local = redis.Redis(
                    host=redis_local_host, 
                    port=6379, 
                    password=redis_local_password, 
                    db=0, 
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                self.r_local.ping()
                print("✅ Connected to Local Redis (Trading Bot)")
            except Exception as e:
                print(f"⚠️ Local Redis connection failed (expected on Render): {e}")
                self.r_local = None
        
        # Allow running without Redis (for Render deploy where SPRING_REDIS_URL not set)
        if not self.r_upstash and not self.r_local:
            if allow_no_redis:
                print("⚠️ Running WITHOUT Redis - prices will be fetched but not cached/published")
            else:
                raise RuntimeError("No Redis connections available - need at least one")

    def _publish_to_both(self, channel: str, message: dict):
        """Publish to local Redis only (Upstash doesn't consume this channel)"""
        payload = json.dumps(message)
        
        # Local (Trading Bot) - only one that consumes market.prices
        if self.r_local:
            try:
                self.r_local.publish(channel, payload)
            except Exception as e:
                print(f"Local Redis publish error: {e}")
        
        # Upstash (Capital Fourge) - NO LONGER PUBLISH (nobody consumes)

    def _set_in_both(self, key: str, value: str, ex: int = 300):
        """Set key in both Redis instances"""
        # Local
        if self.r_local:
            try:
                self.r_local.set(key, value, ex=ex)
            except Exception as e:
                print(f"Local Redis set error: {e}")
        
        # Upstash
        if self.r_upstash:
            try:
                self.r_upstash.set(key, value, ex=ex)
            except Exception as e:
                print(f"Upstash Redis set error: {e}")

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
            # Cache in BOTH Redis instances with 1-hour TTL (matches portfolio-manager cache)
            self._set_in_both(f"price:{resolved_symbol}", str(price), ex=3600)
            
            # NO PUBLISH to market.prices - nobody consumes this channel
            
            return price
        except Exception as e:
            # NO FALLBACK - propagate error so we know when data source fails
            # Yahoo Finance 401 errors will bubble up to caller
            error_str = str(e)
            if "401" in error_str or "Unauthorized" in error_str or "Invalid Crumb" in error_str:
                print(f"⚠️ Yahoo Finance 401/Unauthorized for {symbol}: {e}")
            else:
                print(f"Oracle Error for {symbol}: {e}")
            raise

    def publish_tick(self, symbol: str, price: float, volume: float = 0, bid: float = 0, ask: float = 0):
        """Publish market tick to LOCAL Redis stream only (for Trading Bot consumption)
        Upstash does NOT consume streams - Capital Fourge uses REST API cache."""
        from datetime import datetime
        tick = {
            "symbol": str(symbol),
            "price": str(price),
            "volume": str(volume),
            "bid": str(bid),
            "ask": str(ask),
            "timestamp": datetime.now().isoformat()
        }
        
        # Publish to LOCAL Redis STREAM only (Trading Bot uses XREAD)
        if self.r_local:
            try:
                self.r_local.xadd("market.ticks.equity.*", tick, maxlen=10000)
            except Exception as e:
                print(f"Local stream publish error: {e}")
        
        # Upstash (Capital Fourge) - NO STREAM PUBLISH
        # Capital Fourge reads via REST /prices/batch, not streams