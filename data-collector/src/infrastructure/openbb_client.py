"""
OpenBB SDK Client for fundamental, macro, and alternative data.
Wraps OpenBB's obb object with caching and error handling.
"""
import os
import time
from typing import Any, Dict, List, Optional
from functools import lru_cache

# Load env
from dotenv import load_dotenv
load_dotenv(dotenv_path="../../.env")

# OpenBB imports
from openbb import obb


class OpenBBClient:
    """Wrapper around OpenBB SDK with caching and standardized responses."""
    
    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache
        self._cache: Dict[str, tuple] = {}
        self.CACHE_TTL = 300  # 5 minutes
    
    def _is_cache_valid(self, cached: Optional[tuple]) -> bool:
        if not cached:
            return False
        _, timestamp = cached
        return (time.time() - timestamp) < self.CACHE_TTL
    
    def _get_cached(self, key: str) -> Optional[Any]:
        if not self.use_cache:
            return None
        cached = self._cache.get(key)
        if self._is_cache_valid(cached):
            return cached[0]
        return None
    
    def _set_cache(self, key: str, value: Any):
        if self.use_cache:
            self._cache[key] = (value, time.time())
    
    def _execute_query(self, query_func, **kwargs) -> Any:
        """Execute OpenBB query with error handling."""
        try:
            result = query_func(**kwargs)
            if hasattr(result, 'to_df'):
                return result.to_df().to_dict(orient='records')
            elif hasattr(result, 'results'):
                return result.results
            return result
        except Exception as e:
            print(f"⚠️ OpenBB query error: {e}")
            return None
    
    # ============ FUNDAMENTALS ============
    
    def get_company_profile(self, symbol: str) -> Dict[str, Any]:
        """Get company profile (name, exchange, sector, description, etc.)."""
        cache_key = f"profile:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(obb.equity.profile, symbol=symbol)
        self._set_cache(cache_key, result)
        return result or {}
    
    def get_fundamentals(self, symbol: str, period: str = "annual") -> Dict[str, Any]:
        """
        Get fundamental financial statements.
        Period: annual, quarter
        Returns: income_statement, balance_sheet, cash_flow, ratios
        """
        cache_key = f"fundamentals:{symbol}:{period}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.fundamental, 
            symbol=symbol, 
            period=period
        )
        self._set_cache(cache_key, result)
        return result or {}
    
    def get_ratios(self, symbol: str, period: str = "annual") -> List[Dict]:
        """Get key financial ratios (PE, PB, ROE, ROA, margins, etc.)."""
        cache_key = f"ratios:{symbol}:{period}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.fundamental.ratios,
            symbol=symbol,
            period=period
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_earnings(self, symbol: str, limit: int = 8) -> List[Dict]:
        """Get earnings history and estimates."""
        cache_key = f"earnings:{symbol}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.fundamental.earnings,
            symbol=symbol,
            limit=limit
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_dividends(self, symbol: str, limit: int = 20) -> List[Dict]:
        """Get dividend history."""
        cache_key = f"dividends:{symbol}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.price.dividends,
            symbol=symbol,
            limit=limit
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_splits(self, symbol: str, limit: int = 20) -> List[Dict]:
        """Get stock split history."""
        cache_key = f"splits:{symbol}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.price.splits,
            symbol=symbol,
            limit=limit
        )
        self._set_cache(cache_key, result)
        return result or []
    
    # ============ MACRO / ECONOMY ============
    
    def get_fred_series(self, series_id: str, start_date: str = None, end_date: str = None) -> List[Dict]:
        """Get FRED economic series (T10Y2Y, GDP, CPI, UNRATE, etc.)."""
        cache_key = f"fred:{series_id}:{start_date}:{end_date}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        kwargs = {"series_id": series_id}
        if start_date:
            kwargs["start_date"] = start_date
        if end_date:
            kwargs["end_date"] = end_date
            
        result = self._execute_query(obb.economy.fred, **kwargs)
        self._set_cache(cache_key, result)
        return result or []
    
    def get_treasury_rates(self, maturity: str = "10y") -> List[Dict]:
        """Get treasury yield curve data."""
        cache_key = f"treasury:{maturity}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(obb.economy.treasury, maturity=maturity)
        self._set_cache(cache_key, result)
        return result or []
    
    def get_economic_calendar(self, country: str = "united_states", 
                              start_date: str = None, end_date: str = None) -> List[Dict]:
        """Get economic events calendar."""
        cache_key = f"calendar:{country}:{start_date}:{end_date}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        kwargs = {"country": country}
        if start_date:
            kwargs["start_date"] = start_date
        if end_date:
            kwargs["end_date"] = end_date
            
        result = self._execute_query(obb.economy.calendar, **kwargs)
        self._set_cache(cache_key, result)
        return result or []
    
    # ============ ETF / FUND DATA ============
    
    def get_etf_holdings(self, symbol: str) -> List[Dict]:
        """Get ETF holdings."""
        cache_key = f"etf_holdings:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(obb.etf.holdings, symbol=symbol)
        self._set_cache(cache_key, result)
        return result or []
    
    def get_etf_info(self, symbol: str) -> Dict[str, Any]:
        """Get ETF info (expense ratio, AUM, etc.)."""
        cache_key = f"etf_info:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(obb.etf.info, symbol=symbol)
        self._set_cache(cache_key, result)
        return result or {}
    
    # ============ SEARCH / DISCOVERY ============
    
    def search_symbols(self, query: str) -> List[Dict]:
        """Search for symbols by name/ticker."""
        cache_key = f"search:{query}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(obb.equity.search, query=query)
        self._set_cache(cache_key, result)
        return result or []
    
    # ============ ALTERNATIVE DATA ============
    
    def get_insider_transactions(self, symbol: str, limit: int = 20) -> List[Dict]:
        """Get insider trading transactions."""
        cache_key = f"insider:{symbol}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.ownership.insider,
            symbol=symbol,
            limit=limit
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_institutional_ownership(self, symbol: str, limit: int = 20) -> List[Dict]:
        """Get institutional ownership."""
        cache_key = f"institutional:{symbol}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.ownership.institutional,
            symbol=symbol,
            limit=limit
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_short_interest(self, symbol: str) -> List[Dict]:
        """Get short interest data."""
        cache_key = f"short_interest:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.short_interest,
            symbol=symbol
        )
        self._set_cache(cache_key, result)
        return result or []
    
    def get_analyst_ratings(self, symbol: str) -> List[Dict]:
        """Get analyst ratings/estimates."""
        cache_key = f"ratings:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        result = self._execute_query(
            obb.equity.estimates,
            symbol=symbol
        )
        self._set_cache(cache_key, result)
        return result or []


# Singleton instance
_openbb_client = None

def get_openbb_client() -> OpenBBClient:
    global _openbb_client
    if _openbb_client is None:
        _openbb_client = OpenBBClient()
    return _openbb_client


# Convenience functions
def get_profile(symbol: str) -> Dict[str, Any]:
    return get_openbb_client().get_company_profile(symbol)

def get_fundamentals(symbol: str, period: str = "annual") -> Dict[str, Any]:
    return get_openbb_client().get_fundamentals(symbol, period)

def get_ratios(symbol: str, period: str = "annual") -> List[Dict]:
    return get_openbb_client().get_ratios(symbol, period)

def get_earnings(symbol: str, limit: int = 8) -> List[Dict]:
    return get_openbb_client().get_earnings(symbol, limit)

def get_dividends(symbol: str, limit: int = 20) -> List[Dict]:
    return get_openbb_client().get_dividends(symbol, limit)

def get_fred_series(series_id: str, start_date: str = None, end_date: str = None) -> List[Dict]:
    return get_openbb_client().get_fred_series(series_id, start_date, end_date)

def get_treasury_rates(maturity: str = "10y") -> List[Dict]:
    return get_openbb_client().get_treasury_rates(maturity)

def get_etf_holdings(symbol: str) -> List[Dict]:
    return get_openbb_client().get_etf_holdings(symbol)

def get_insider_transactions(symbol: str, limit: int = 20) -> List[Dict]:
    return get_openbb_client().get_insider_transactions(symbol, limit)

def get_institutional_ownership(symbol: str, limit: int = 20) -> List[Dict]:
    return get_openbb_client().get_institutional_ownership(symbol, limit)

def get_short_interest(symbol: str) -> List[Dict]:
    return get_openbb_client().get_short_interest(symbol)

def get_analyst_ratings(symbol: str) -> List[Dict]:
    return get_openbb_client().get_analyst_ratings(symbol)