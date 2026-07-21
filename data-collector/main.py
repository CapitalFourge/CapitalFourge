from typing import Any
from typing import Dict
from typing import List
import os
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv
import threading
from src.infrastructure.grpc_server import serve
from src.infrastructure.mongo_repository import MongoFinancialDataRepository
from src.infrastructure.polars_processor import PolarsDataProcessor
from src.application.services import FinancialDataService
from src.application.price_oracle import PriceOracle
from src.infrastructure.finnhub_client import get_news, get_sentiment, get_market_news

load_dotenv(dotenv_path="../.env")
app = FastAPI(title="Capital Fourge Data Collector")

API_KEY = os.getenv("SERVICE_API_KEY", "internal-service-key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def require_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# 2. Configurar la Infraestructura (Adaptadores)
mongo_host = os.getenv("DB_MONGO_HOST", "localhost")
mongo_pass = os.getenv("DB_MONGO_ROOT_PASSWORD")
uri = f"mongodb://admin:{mongo_pass}@{mongo_host}:27017/?authSource=admin"

repo = MongoFinancialDataRepository(connection_string=uri, database_name="capital_fourge_data")
processor = PolarsDataProcessor()
service = FinancialDataService(repository=repo, processor=processor)
oracle = PriceOracle()
print("🛰️ Iniciando servidor gRPC en hilo secundario...")
grpc_thread = threading.Thread(target=serve, daemon=True)
grpc_thread.start()

@app.get("/health")
def health_check():
    return {"status": "alive","service": "data_collector"}

@app.post("/collect/batch", dependencies=[Depends(require_api_key)])
def collect_batch(data: List[Dict[str, Any]]):
    count = service.process_and_store_batch(data)
    return {"message": f"Successfully processed and stored {count} records using Polars"}

@app.post("/collect/{symbol}", dependencies=[Depends(require_api_key)])
def collect_data(symbol: str, price: float):
    success = service.collect_and_store(symbol,price)
    if success:
        return {"message": f"Data for {symbol} stored successfully"}
    return {"message": "Failed to store data", "status": 500}

@app.get("/price/{symbol}", dependencies=[Depends(require_api_key)])
def sync_price(symbol: str):
    price = oracle.fetch_and_cache(symbol)
    if price > 0:
        return {"symbol": symbol, "price": price, "status": "synchronized"}
    return {"error": "Symbol not found", "status": 404}

# === NUEVOS ENDPOINTS REST - USAN PRICEORACLE DIRECTO (SIN gRPC INTERNO) ===
from pydantic import BaseModel
from typing import List, Optional

class BatchPriceRequest(BaseModel):
    symbols: List[str]

class PriceHistoryRequest(BaseModel):
    symbol: str
    days: int = 30

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

# Resolución de símbolos (copiado de grpc_server.py)
COLOMBIAN_MAP = {
    'EC': 'ECOL.BOG', 'ECOPETROL': 'ECOL.BOG',
    'AVAL': 'AVAL.BOG',
    'BANCOLOMBIA': 'BANCOLOMBIA.BOG', 'BANCO': 'BANCOLOMBIA.BOG',
    'PF': 'PFAVAL.BOG',
    'CEMEX': 'CEMEX.BOG',
    'CEMEXCOL': 'CEMEX.BOG',
    'CIBEST': 'CIBEST.CL',
}

LATAM_SUFFIXES = ['.BOG', '.CL', '.MX', '.SA', '.AR', '.PE']

def resolve_yfinance_symbol(symbol: str):
    if symbol in COLOMBIAN_MAP:
        return COLOMBIAN_MAP[symbol]
    try:
        import yfinance as yf
        t = yf.Ticker(symbol)
        info = t.info
        if info and ('symbol' in info or 'shortName' in info or 'longName' in info):
            return symbol
    except Exception:
        pass
    for suffix in LATAM_SUFFIXES:
        try:
            import yfinance as yf
            t = yf.Ticker(symbol + suffix)
            info = t.info
            if info and ('symbol' in info or 'shortName' in info or 'longName' in info):
                return symbol + suffix
        except Exception:
            continue
    return symbol

def _get_market_cap(ticker, info) -> float:
    for key in ('marketCap', 'enterpriseValue', 'market_cap', 'totalValue'):
        value = info.get(key)
        if value is not None and float(value) > 0:
            return float(value)
    try:
        fast = ticker.fast_info
        for key in ('marketCap', 'enterpriseValue'):
            try:
                value = getattr(fast, key, None)
            except Exception:
                continue
            if value is not None:
                return float(value)
    except Exception:
        pass
    if info.get('shares') and info.get('shares') > 0 and info.get('lastPrice'):
        return float(info['shares']) * float(info['lastPrice'])
    return 0.0

@app.get("/prices/batch", dependencies=[Depends(require_api_key)])
def get_batch_prices(symbols: str):
    """GET /prices/batch?symbols=AAPL,MSFT,BTC-USD"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    result = {}
    for symbol in symbol_list:
        yf_symbol = resolve_yfinance_symbol(symbol)
        price = oracle.fetch_and_cache(yf_symbol)
        result[symbol] = price
    return {"prices": result}

@app.get("/price/history/{symbol}", dependencies=[Depends(require_api_key)])
def get_price_history(symbol: str, days: int = 30):
    yf_symbol = resolve_yfinance_symbol(symbol)
    try:
        import yfinance as yf
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=f"{days}d")
        info = ticker.info
        
        is_crypto = symbol.endswith('-USD')
        is_commodity = symbol.endswith('=F') or symbol in ['GC', 'SI', 'CL', 'NG', 'HG', 'BZ', 'PL', 'PA']
        
        points = []
        for date, row in hist.iterrows():
            point_data = {
                'timestamp': date.strftime('%Y-%m-%d'),
                'price': float(row['Close']),
                'volume': float(row['Volume']),
                'market_cap': _get_market_cap(ticker, info),
                'trailing_pe': float(info.get('trailingPE', 0)) if info.get('trailingPE') else 0.0,
                'forward_pe': float(info.get('forwardPE', 0)) if info.get('forwardPE') else 0.0,
                'peg_ratio': float(info.get('pegRatio', 0)) if info.get('pegRatio') else 0.0,
                'price_to_book': float(info.get('priceToBook', 0)) if info.get('priceToBook') else 0.0,
                'price_to_sales': float(info.get('priceToSalesTrailing12Months', 0)) if info.get('priceToSalesTrailing12Months') else 0.0,
                'enterprise_to_ebitda': float(info.get('enterpriseToEbitda', 0)) if info.get('enterpriseToEbitda') else 0.0,
                'profit_margins': float(info.get('profitMargins', 0)) if info.get('profitMargins') else 0.0,
                'operating_margins': float(info.get('operatingMargins', 0)) if info.get('operatingMargins') else 0.0,
                'return_on_equity': float(info.get('returnOnEquity', 0)) if info.get('returnOnEquity') else 0.0,
                'return_on_assets': float(info.get('returnOnAssets', 0)) if info.get('returnOnAssets') else 0.0,
                'debt_to_equity': float(info.get('debtToEquity', 0)) if info.get('debtToEquity') else 0.0,
                'current_ratio': float(info.get('currentRatio', 0)) if info.get('currentRatio') else 0.0,
                'quick_ratio': float(info.get('quickRatio', 0)) if info.get('quickRatio') else 0.0,
                'dividend_yield': float(info.get('dividendYield', 0)) if info.get('dividendYield') else 0.0,
                'free_cash_flow': float(info.get('freeCashflow', 0)) if info.get('freeCashflow') else 0.0,
            }
            points.append(point_data)
        return points
    except Exception as e:
        return [{"error": str(e)}]

@app.get("/assets/categorized", dependencies=[Depends(require_api_key)])
def get_categorized_assets():
    assets = [
        {"symbol": "AAPL", "name": "Apple Inc.", "category": "STOCKS"},
        {"symbol": "ADBE", "name": "Adobe Inc.", "category": "STOCKS"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "category": "STOCKS"},
        {"symbol": "MSFT", "name": "Microsoft Corp.", "category": "STOCKS"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "category": "STOCKS"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "category": "STOCKS"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "category": "STOCKS"},
        {"symbol": "NFLX", "name": "Netflix, Inc.", "category": "STOCKS"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "category": "STOCKS"},
        {"symbol": "META", "name": "Meta Platforms, Inc.", "category": "STOCKS"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "category": "STOCKS"},
        {"symbol": "V", "name": "Visa Inc.", "category": "STOCKS"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "category": "STOCKS"},
        {"symbol": "DIS", "name": "The Walt Disney Co.", "category": "STOCKS"},
        {"symbol": "MA", "name": "Mastercard Inc.", "category": "STOCKS"},
        {"symbol": "EC", "name": "Ecopetrol S.A.", "category": "STOCKS"},
        {"symbol": "ECOPETROL", "name": "Ecopetrol S.A.", "category": "STOCKS"},
        {"symbol": "AVAL", "name": "Grupo Aval Acciones y Valores", "category": "STOCKS"},
        {"symbol": "BANCOLOMBIA", "name": "Bancolombia S.A.", "category": "STOCKS"},
        {"symbol": "PF", "name": "Pfizer S.A.", "category": "STOCKS"},
        {"symbol": "CEMEX", "name": "CEMEX S.A.", "category": "STOCKS"},
        {"symbol": "ISA", "name": "ISA Interconexión Eléctrica", "category": "STOCKS"},
        {"symbol": "BOGOTA", "name": "Banco de Bogotá", "category": "STOCKS"},
        {"symbol": "CELSIA", "name": "CELSIA Energía", "category": "STOCKS"},
        {"symbol": "BTC-USD", "name": "Bitcoin", "category": "CRYPTO"},
        {"symbol": "ETH-USD", "name": "Ethereum", "category": "CRYPTO"},
        {"symbol": "SOL-USD", "name": "Solana", "category": "CRYPTO"},
        {"symbol": "ADA-USD", "name": "Cardano", "category": "CRYPTO"},
        {"symbol": "DOT-USD", "name": "Polkadot", "category": "CRYPTO"},
        {"symbol": "XRP-USD", "name": "XRP", "category": "CRYPTO"},
        {"symbol": "DOGE-USD", "name": "Dogecoin", "category": "CRYPTO"},
        {"symbol": "MATIC-USD", "name": "Polygon", "category": "CRYPTO"},
        {"symbol": "LINK-USD", "name": "Chainlink", "category": "CRYPTO"},
        {"symbol": "AVAX-USD", "name": "Avalanche", "category": "CRYPTO"},
        {"symbol": "GC=F", "name": "Gold", "category": "COMMODITIES"},
        {"symbol": "SI=F", "name": "Silver", "category": "COMMODITIES"},
        {"symbol": "CL=F", "name": "Crude Oil", "category": "COMMODITIES"},
        {"symbol": "NG=F", "name": "Natural Gas", "category": "COMMODITIES"},
        {"symbol": "HG=F", "name": "Copper", "category": "COMMODITIES"},
        {"symbol": "BZ=F", "name": "Brent Crude Oil", "category": "COMMODITIES"},
        {"symbol": "PL=F", "name": "Platinum", "category": "COMMODITIES"},
        {"symbol": "PA=F", "name": "Palladium", "category": "COMMODITIES"},
        {"symbol": "EURUSD=X", "name": "EUR/USD", "category": "FOREX"},
        {"symbol": "GBPUSD=X", "name": "GBP/USD", "category": "FOREX"},
        {"symbol": "JPY=X", "name": "USD/JPY", "category": "FOREX"},
        {"symbol": "MXN=X", "name": "USD/MXN", "category": "FOREX"},
        {"symbol": "CAD=X", "name": "USD/CAD", "category": "FOREX"},
        {"symbol": "AUDUSD=X", "name": "AUD/USD", "category": "FOREX"},
        {"symbol": "CHF=X", "name": "USD/CHF", "category": "FOREX"},
        {"symbol": "NZDUSD=X", "name": "NZD/USD", "category": "FOREX"},
        {"symbol": "EURGBP=X", "name": "EUR/GBP", "category": "FOREX"},
        {"symbol": "EURJPY=X", "name": "EUR/JPY", "category": "FOREX"}
    ]
    return assets

@app.get("/assets/symbols", dependencies=[Depends(require_api_key)])
def get_available_symbols():
    popular_symbols = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "DIS",
        "EC", "AVAL", "BANCOLOMBIA", "PF", "CEMEX",
        "CIBEST", "ISA", "ETB", "BOGOTA", "CELSIA",
        "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
        "GC=F", "SI=F", "CL=F", "NG=F", "HG=F",
        "EURUSD=X", "GBPUSD=X", "USDJPY=X"
    ]
    return popular_symbols

@app.post("/assets/search", dependencies=[Depends(require_api_key)])
def search_symbols(request: SearchRequest):
    query = request.query.upper().strip()
    limit = request.limit
    if not query:
        return []
    try:
        categorized = get_categorized_assets()
        query_lower = query.lower()
        matches = [a for a in categorized 
                   if query_lower in a["symbol"].lower() or query_lower in a["name"].lower()]
        if matches:
            return matches[:limit]
    except Exception as e:
        print(f"⚠️ Error searching categorized assets: {e}")
    yf_query = resolve_yfinance_symbol(query)
    if yf_query != query:
        try:
            import yfinance as yf
            ticker = yf.Ticker(yf_query)
            info = ticker.info
            name = info.get('shortName') or info.get('longName') or info.get('displayName')
            if name:
                category = 'STOCKS'
                if query.endswith('-USD'):
                    category = 'CRYPTO'
                elif query.endswith('=F'):
                    category = 'COMMODITIES'
                elif query.endswith('=X'):
                    category = 'FOREX'
                print(f"✅ Dynamic resolution: {query} -> {yf_query} ({name}) [{category}]")
                return [{
                    "symbol": query, "name": name, "category": category,
                    "description": "", "website": ""
                }]
        except Exception as e:
            print(f"⚠️ Error validating {query} via yfinance: {e}")
    print(f"❌ No results for: {query}")
    return []

@app.get("/asset/name/{symbol}", dependencies=[Depends(require_api_key)])
def get_asset_name(symbol: str):
    assets = get_categorized_assets()
    for a in assets:
        if a["symbol"] == symbol:
            return {"symbol": symbol, "name": a["name"]}
    return {"symbol": symbol, "name": symbol}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)