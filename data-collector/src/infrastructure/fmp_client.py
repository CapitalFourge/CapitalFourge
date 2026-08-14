import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

FMP_API_KEY = os.getenv("FMP_API_KEY")
BASE = "https://financialmodelingprep.com/stable"


def _fetch_fmp(endpoint: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch data from FMP endpoint."""
    if not FMP_API_KEY or FMP_API_KEY == "your_fmp_api_key_here":
        print("������ FMP_API_KEY not set, skipping FMP fetch")
        return []
    
    url = f"{BASE}/{endpoint}"
    try:
        resp = requests.get(url, params={"apikey": FMP_API_KEY}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data[:limit] if isinstance(data, list) else []
    except Exception as e:
        print(f"������ FMP fetch error for {endpoint}: {e}")
        return []


def get_biggest_gainers(limit: int = 20) -> List[Dict[str, Any]]:
    """Get biggest gainers from FMP."""
    raw = _fetch_fmp("biggest-gainers", limit)
    return _normalize_movers(raw)


def get_biggest_losers(limit: int = 20) -> List[Dict[str, Any]]:
    """Get biggest losers from FMP."""
    raw = _fetch_fmp("biggest-losers", limit)
    return _normalize_movers(raw)


def get_most_active(limit: int = 20) -> List[Dict[str, Any]]:
    """Get most actively traded from FMP."""
    raw = _fetch_fmp("most-actives", limit)
    return _normalize_movers(raw)


def _normalize_movers(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize FMP response to our internal format."""
    normalized = []
    for d in raw:
        try:
            normalized.append({
                "symbol": d.get("symbol", ""),
                "name": d.get("name", ""),
                "price": float(d.get("price", 0)),
                "changePercent": float(d.get("changesPercentage", 0)),
                "changeValue": float(d.get("change", 0)),
                "volume": float(d.get("volume", 0)),
                "changePercent24h": float(d.get("changesPercentage", 0)),
                "volume24h": float(d.get("volume", 0)),
                "exchange": d.get("exchange", ""),
                "fetched_at": datetime.utcnow().isoformat(),
            })
        except (ValueError, TypeError) as e:
            print(f"������ Error normalizing mover {d}: {e}")
            continue
    return normalized


def fetch_all_market_movers(limit_per_category: int = 20) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch all three categories from FMP."""
    return {
        "gainers": get_biggest_gainers(limit_per_category),
        "losers": get_biggest_losers(limit_per_category),
        "most_active": get_most_active(limit_per_category),
    }