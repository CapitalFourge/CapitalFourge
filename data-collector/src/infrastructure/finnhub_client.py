"""
Finnhub API Client for news, sentiment, and market data.
Free tier: 60 requests/minute.
"""
import os
import time
from functools import lru_cache
from typing import Any, Dict, List, Optional

import finnhub
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")


def get_finnhub_client() -> finnhub.Client:
    """Get Finnhub client instance."""
    if not FINNHUB_API_KEY:
        raise ValueError("FINNHUB_API_KEY not set in environment")
    return finnhub.Client(api_key=FINNHUB_API_KEY)


# Simple in-memory cache with TTL
_news_cache: Dict[str, tuple] = {}
_sentiment_cache: Dict[str, tuple] = {}
_market_news_cache: Dict[str, tuple] = {}
CACHE_TTL = 300  # 5 minutes


def _is_cache_valid(cached: Optional[tuple]) -> bool:
    """Check if cached data is still valid."""
    if not cached:
        return False
    _, timestamp = cached
    return (time.time() - timestamp) < CACHE_TTL


def get_news(symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get company news with sentiment analysis.
    
    Args:
        symbol: Stock symbol (e.g., AAPL)
        limit: Maximum number of news items
        
    Returns:
        List of news items with sentiment scores
    """
    cache_key = f"news:{symbol}:{limit}"
    if _is_cache_valid(_news_cache.get(cache_key)):
        return _news_cache[cache_key][0]

    try:
        client = get_finnhub_client()
        # Finnhub expects symbol without exchange suffix for US stocks
        clean_symbol = symbol.replace(".BOG", "").replace(".CL", "").replace(".MX", "").replace(".SA", "").replace(".AR", "").replace(".PE", "")
        
        # Get company news (last 30 days)
        news = client.company_news(clean_symbol, _from="", to="")
        
        if not news:
            return []

        # Process and add sentiment
        processed_news = []
        for item in news[:limit]:
            processed = {
                "headline": item.get("headline", ""),
                "summary": item.get("summary", ""),
                "url": item.get("url", ""),
                "source": item.get("source", ""),
                "datetime": item.get("datetime", 0),
                "image": item.get("image", ""),
                "category": item.get("category", ""),
                "related": item.get("related", ""),
            }
            # Simple sentiment scoring based on keywords
            processed["sentiment_score"] = _calculate_sentiment(processed["headline"] + " " + processed["summary"])
            processed["sentiment_label"] = _sentiment_label(processed["sentiment_score"])
            processed_news.append(processed)

        _news_cache[cache_key] = (processed_news, time.time())
        return processed_news

    except Exception as e:
        print(f"⚠️ Finnhub news error for {symbol}: {e}")
        return []


def get_sentiment(symbol: str) -> Dict[str, Any]:
    """
    Get aggregated sentiment for a symbol.
    
    Returns:
        Dict with sentiment_score, bullish_pct, bearish_pct, article_count
    """
    cache_key = f"sentiment:{symbol}"
    if _is_cache_valid(_sentiment_cache.get(cache_key)):
        return _sentiment_cache[cache_key][0]

    news = get_news(symbol, limit=20)
    
    if not news:
        result = {
            "symbol": symbol,
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "bullish_pct": 0.0,
            "bearish_pct": 0.0,
            "article_count": 0,
            "last_updated": time.time()
        }
        _sentiment_cache[cache_key] = (result, time.time())
        return result

    scores = [n["sentiment_score"] for n in news]
    avg_score = sum(scores) / len(scores)
    bullish = sum(1 for s in scores if s > 0.1)
    bearish = sum(1 for s in scores if s < -0.1)
    total = len(scores)

    result = {
        "symbol": symbol,
        "sentiment_score": round(avg_score, 3),
        "sentiment_label": _sentiment_label(avg_score),
        "bullish_pct": round(bullish / total * 100, 1),
        "bearish_pct": round(bearish / total * 100, 1),
        "article_count": total,
        "last_updated": time.time()
    }
    _sentiment_cache[cache_key] = (result, time.time())
    return result


def get_market_news(category: str = "general", limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get general market news by category.
    
    Categories: general, forex, crypto, merger
    """
    cache_key = f"market_news:{category}:{limit}"
    if _is_cache_valid(_market_news_cache.get(cache_key)):
        return _market_news_cache[cache_key][0]

    try:
        client = get_finnhub_client()
        news = client.general_news(category, min_id=0)
        
        processed = []
        for item in news[:limit]:
            processed.append({
                "headline": item.get("headline", ""),
                "summary": item.get("summary", ""),
                "url": item.get("url", ""),
                "source": item.get("source", ""),
                "datetime": item.get("datetime", 0),
                "image": item.get("image", ""),
                "category": item.get("category", ""),
                "sentiment_score": _calculate_sentiment(item.get("headline", "") + " " + item.get("summary", "")),
                "sentiment_label": _sentiment_label(_calculate_sentiment(item.get("headline", "") + " " + item.get("summary", ""))),
            })
        
        _market_news_cache[cache_key] = (processed, time.time())
        return processed

    except Exception as e:
        print(f"⚠️ Finnhub market news error: {e}")
        return []


# --- Sentiment Analysis Helpers ---

BULLISH_KEYWORDS = [
    "surge", "rally", "gain", "rise", "up", "bull", "positive", "beat", "exceed",
    "strong", "growth", "profit", "record", "high", "upgrade", "buy", "bullish",
    "outperform", "optimistic", "recovery", "boom", "soar", "jump", "climb"
]

BEARISH_KEYWORDS = [
    "fall", "drop", "decline", "down", "bear", "negative", "miss", "weak",
    "loss", "low", "downgrade", "sell", "bearish", "underperform", "pessimistic",
    "crash", "plunge", "tumble", "slide", "recession", "risk", "concern", "warn"
]


def _calculate_sentiment(text: str) -> float:
    """Simple keyword-based sentiment scoring (-1 to 1)."""
    if not text:
        return 0.0
    
    text_lower = text.lower()
    bullish_count = sum(1 for kw in BULLISH_KEYWORDS if kw in text_lower)
    bearish_count = sum(1 for kw in BEARISH_KEYWORDS if kw in text_lower)
    
    total = bullish_count + bearish_count
    if total == 0:
        return 0.0
    
    # Score from -1 to 1
    score = (bullish_count - bearish_count) / total
    return round(max(-1.0, min(1.0, score)), 3)


def _sentiment_label(score: float) -> str:
    """Convert score to label."""
    if score > 0.2:
        return "bullish"
    elif score < -0.2:
        return "bearish"
    return "neutral"