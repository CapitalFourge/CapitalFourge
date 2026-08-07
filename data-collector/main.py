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

@app.get("/debug/api-key")
def debug_api_key(api_key: str = Security(api_key_header)):
    return {
        "expected": API_KEY,
        "received": api_key,
        "match": api_key == API_KEY if api_key else False
    }

async def require_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# 2. Configurar la Infraestructura (Adaptadores)
# DB_MONGO_HOST ya contiene la URI completa de Atlas
mongo_uri = os.getenv("DB_MONGO_HOST")
repo = None
if mongo_uri:
    repo = MongoFinancialDataRepository(connection_string=mongo_uri, database_name="capital_fourge_data")
else:
    print("⚠️  DB_MONGO_HOST not set, running without MongoDB")
    repo = None

processor = PolarsDataProcessor()
service = FinancialDataService(repository=repo, processor=processor)

# PriceOracle: conecta a AMBOS Redis (Upstash para Capital Fourge + Local para Trading Bot)
# En Render: connect_local=False (no hay Redis local), allow_no_redis=True si no hay SPRING_REDIS_URL
import socket
is_render = os.getenv("RENDER") == "true" or "render.com" in socket.gethostname()

upstash_url = os.getenv("SPRING_REDIS_URL")  # Upstash URL from Render
print(f"🔍 DEBUG: RENDER={os.getenv('RENDER')}, hostname={socket.gethostname()}, is_render={is_render}")
print(f"🔍 DEBUG: SPRING_REDIS_URL={'SET' if upstash_url else 'NOT SET'}")
if upstash_url:
    print(f"🔍 DEBUG: SPRING_REDIS_URL starts with: {upstash_url[:50]}...")

allow_no_redis = not upstash_url and is_render  # Allow no Redis if on Render without SPRING_REDIS_URL

oracle = PriceOracle(
    redis_upstash_url=upstash_url,
    redis_local_host=os.getenv("DB_REDIS_HOST", "localhost"),
    redis_local_password=os.getenv("DB_REDIS_PASSWORD", ""),
    connect_local=not is_render,  # Disable local Redis on Render
    allow_no_redis=allow_no_redis  # Allow running without Redis on Render
)
print("🛰️ Iniciando servidor gRPC en hilo secundario...")
grpc_thread = threading.Thread(target=serve, daemon=True)
grpc_thread.start()

@app.get("/")
def root():
    return {"status": "alive", "service": "data_collector", "version": "2.0.0", "deployed": "2026-08-05-v2"}

@app.get("/health")
def health_check():
    return {"status": "alive","service": "data_collector", "version": "1.0.1"}

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
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
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
def get_categorized_assets(category: str = None):
    assets = [
        {"symbol": "AAPL", "name": "Apple Inc.", "category": "STOCKS", "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.", "website": "https://www.apple.com", "logo": "https://logo.clearbit.com/apple.com", "sector": "Technology", "industry": "Consumer Electronics"},
        {"symbol": "ADBE", "name": "Adobe Inc.", "category": "STOCKS", "description": "Adobe Inc. operates as a diversified software company worldwide.", "website": "https://www.adobe.com", "logo": "https://logo.clearbit.com/adobe.com", "sector": "Technology", "industry": "Software—Infrastructure"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "category": "STOCKS", "description": "Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.", "website": "https://abc.xyz", "logo": "https://logo.clearbit.com/google.com", "sector": "Communication Services", "industry": "Internet Content & Information"},
        {"symbol": "MSFT", "name": "Microsoft Corp.", "category": "STOCKS", "description": "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.", "website": "https://www.microsoft.com", "logo": "https://logo.clearbit.com/microsoft.com", "sector": "Technology", "industry": "Software—Infrastructure"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "category": "STOCKS", "description": "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally.", "website": "https://www.amazon.com", "logo": "https://logo.clearbit.com/amazon.com", "sector": "Consumer Cyclical", "industry": "Internet Retail"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "category": "STOCKS", "description": "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.", "website": "https://www.tesla.com", "logo": "https://logo.clearbit.com/tesla.com", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "category": "STOCKS", "description": "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.", "website": "https://www.nvidia.com", "logo": "https://logo.clearbit.com/nvidia.com", "sector": "Technology", "industry": "Semiconductors"},
        {"symbol": "NFLX", "name": "Netflix, Inc.", "category": "STOCKS", "description": "Netflix, Inc. provides entertainment services in the United States and internationally.", "website": "https://www.netflix.com", "logo": "https://logo.clearbit.com/netflix.com", "sector": "Communication Services", "industry": "Entertainment"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "category": "STOCKS", "description": "Advanced Micro Devices, Inc. operates as a semiconductor company worldwide.", "website": "https://www.amd.com", "logo": "https://logo.clearbit.com/amd.com", "sector": "Technology", "industry": "Semiconductors"},
        {"symbol": "META", "name": "Meta Platforms, Inc.", "category": "STOCKS", "description": "Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.", "website": "https://about.meta.com", "logo": "https://logo.clearbit.com/meta.com", "sector": "Communication Services", "industry": "Internet Content & Information"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "category": "STOCKS", "description": "Berkshire Hathaway Inc., through its subsidiaries, engages in the insurance, freight rail transportation, and utility businesses worldwide.", "website": "https://www.berkshirehathaway.com", "logo": "https://logo.clearbit.com/berkshirehathaway.com", "sector": "Financial Services", "industry": "Insurance—Diversified"},
        {"symbol": "V", "name": "Visa Inc.", "category": "STOCKS", "description": "Visa Inc. operates as a payment technology company worldwide.", "website": "https://www.visa.com", "logo": "https://logo.clearbit.com/visa.com", "sector": "Financial Services", "industry": "Credit Services"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "category": "STOCKS", "description": "JPMorgan Chase & Co. operates as a financial services company worldwide.", "website": "https://www.jpmorganchase.com", "logo": "https://logo.clearbit.com/jpmorganchase.com", "sector": "Financial Services", "industry": "Banks—Diversified"},
        {"symbol": "DIS", "name": "The Walt Disney Co.", "category": "STOCKS", "description": "The Walt Disney Company, together with its subsidiaries, operates as an entertainment company worldwide.", "website": "https://www.disney.com", "logo": "https://logo.clearbit.com/disney.com", "sector": "Communication Services", "industry": "Entertainment"},
        {"symbol": "MA", "name": "Mastercard Inc.", "category": "STOCKS", "description": "Mastercard Incorporated, a technology company, provides transaction processing and other payment-related products and services in the United States and internationally.", "website": "https://www.mastercard.com", "logo": "https://logo.clearbit.com/mastercard.com", "sector": "Financial Services", "industry": "Credit Services"},
        {"symbol": "EC", "name": "Ecopetrol S.A.", "category": "STOCKS", "description": "Ecopetrol S.A. operates as an integrated energy company in Colombia and internationally.", "website": "https://www.ecopetrol.com.co", "logo": "https://logo.clearbit.com/ecopetrol.com.co", "sector": "Energy", "industry": "Oil & Gas Integrated"},
        {"symbol": "ECOPETROL", "name": "Ecopetrol S.A.", "category": "STOCKS", "description": "Ecopetrol S.A. operates as an integrated energy company in Colombia and internationally.", "website": "https://www.ecopetrol.com.co", "logo": "https://logo.clearbit.com/ecopetrol.com.co", "sector": "Energy", "industry": "Oil & Gas Integrated"},
        {"symbol": "AVAL", "name": "Grupo Aval Acciones y Valores", "category": "STOCKS", "description": "Grupo Aval Acciones y Valores S.A. provides financial services and products in Colombia and Central America.", "website": "https://www.grupoaval.com", "logo": "https://logo.clearbit.com/grupoaval.com", "sector": "Financial Services", "industry": "Banks—Regional"},
        {"symbol": "BANCOLOMBIA", "name": "Bancolombia S.A.", "category": "STOCKS", "description": "Bancolombia S.A. provides banking products and services in Colombia, Panama, El Salvador, the United States, and Puerto Rico.", "website": "https://www.bancolombia.com", "logo": "https://logo.clearbit.com/bancolombia.com", "sector": "Financial Services", "industry": "Banks—Regional"},
        {"symbol": "PF", "name": "Pfizer S.A.", "category": "STOCKS", "description": "Pfizer Inc. discovers, develops, manufactures, markets, distributes, and sells biopharmaceutical products worldwide.", "website": "https://www.pfizer.com", "logo": "https://logo.clearbit.com/pfizer.com", "sector": "Healthcare", "industry": "Drug Manufacturers—General"},
        {"symbol": "CEMEX", "name": "CEMEX S.A.", "category": "STOCKS", "description": "CEMEX, S.A.B. de C.V., together with its subsidiaries, produces, markets, distributes, and sells cement, ready-mix concrete, aggregates, urbanization solutions, and other construction materials worldwide.", "website": "https://www.cemex.com", "logo": "https://logo.clearbit.com/cemex.com", "sector": "Basic Materials", "industry": "Building Materials"},
        {"symbol": "ISA", "name": "ISA Interconexión Eléctrica", "category": "STOCKS", "description": "Interconexión Eléctrica S.A. E.S.P. transmits, operates, and maintains electric energy in Colombia, Peru, Bolivia, Brazil, Chile, and internationally.", "website": "https://www.isa.co", "logo": "https://logo.clearbit.com/isa.co", "sector": "Utilities—Regulated", "industry": "Utilities—Regulated Electric"},
        {"symbol": "BOGOTA", "name": "Banco de Bogotá", "category": "STOCKS", "description": "Banco de Bogotá S.A. provides various banking products and services in Colombia and internationally.", "website": "https://www.bancodebogota.com", "logo": "https://logo.clearbit.com/bancodebogota.com", "sector": "Financial Services", "industry": "Banks—Regional"},
        {"symbol": "CELSIA", "name": "CELSIA Energía", "category": "STOCKS", "description": "Celsia S.A. E.S.P., an energy company, generates, transmits, distributes, and markets electric energy in Colombia, Panama, and Central America.", "website": "https://www.celsia.com", "logo": "https://logo.clearbit.com/celsia.com", "sector": "Utilities—Regulated", "industry": "Utilities—Regulated Electric"},
        {"symbol": "BTC-USD", "name": "Bitcoin", "category": "CRYPTO", "description": "Bitcoin is a decentralized digital currency.", "website": "https://bitcoin.org", "logo": "https://logo.clearbit.com/bitcoin.org", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "ETH-USD", "name": "Ethereum", "category": "CRYPTO", "description": "Ethereum is a decentralized, open-source blockchain with smart contract functionality.", "website": "https://ethereum.org", "logo": "https://logo.clearbit.com/ethereum.org", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "SOL-USD", "name": "Solana", "category": "CRYPTO", "description": "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today.", "website": "https://solana.com", "logo": "https://logo.clearbit.com/solana.com", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "ADA-USD", "name": "Cardano", "category": "CRYPTO", "description": "Cardano is a proof-of-stake blockchain platform.", "website": "https://cardano.org", "logo": "https://logo.clearbit.com/cardano.org", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "DOT-USD", "name": "Polkadot", "category": "CRYPTO", "description": "Polkadot enables cross-blockchain transfers of any type of data or asset.", "website": "https://polkadot.network", "logo": "https://logo.clearbit.com/polkadot.network", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "XRP-USD", "name": "XRP", "category": "CRYPTO", "description": "XRP is a digital asset built for payments.", "website": "https://xrpl.org", "logo": "https://logo.clearbit.com/xrpl.org", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "DOGE-USD", "name": "Dogecoin", "category": "CRYPTO", "description": "Dogecoin is a cryptocurrency created as a joke.", "website": "https://dogecoin.com", "logo": "https://logo.clearbit.com/dogecoin.com", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "MATIC-USD", "name": "Polygon", "category": "CRYPTO", "description": "Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.", "website": "https://polygon.technology", "logo": "https://logo.clearbit.com/polygon.technology", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "LINK-USD", "name": "Chainlink", "category": "CRYPTO", "description": "Chainlink is a decentralized oracle network.", "website": "https://chain.link", "logo": "https://logo.clearbit.com/chain.link", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "AVAX-USD", "name": "Avalanche", "category": "CRYPTO", "description": "Avalanche is a decentralized platform for building applications.", "website": "https://avax.network", "logo": "https://logo.clearbit.com/avax.network", "sector": "Cryptocurrency", "industry": "Cryptocurrency"},
        {"symbol": "GC=F", "name": "Gold", "category": "COMMODITIES", "description": "Gold futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Precious Metals"},
        {"symbol": "SI=F", "name": "Silver", "category": "COMMODITIES", "description": "Silver futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Precious Metals"},
        {"symbol": "CL=F", "name": "Crude Oil", "category": "COMMODITIES", "description": "Crude oil futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Energy"},
        {"symbol": "NG=F", "name": "Natural Gas", "category": "COMMODITIES", "description": "Natural gas futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Energy"},
        {"symbol": "HG=F", "name": "Copper", "category": "COMMODITIES", "description": "Copper futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Industrial Metals"},
        {"symbol": "BZ=F", "name": "Brent Crude Oil", "category": "COMMODITIES", "description": "Brent crude oil futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Energy"},
        {"symbol": "PL=F", "name": "Platinum", "category": "COMMODITIES", "description": "Platinum futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Precious Metals"},
        {"symbol": "PA=F", "name": "Palladium", "category": "COMMODITIES", "description": "Palladium futures.", "website": "", "logo": "", "sector": "Commodities", "industry": "Precious Metals"},
        {"symbol": "EURUSD=X", "name": "EUR/USD", "category": "FOREX", "description": "Euro to US Dollar exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "GBPUSD=X", "name": "GBP/USD", "category": "FOREX", "description": "British Pound to US Dollar exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "JPY=X", "name": "USD/JPY", "category": "FOREX", "description": "US Dollar to Japanese Yen exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "MXN=X", "name": "USD/MXN", "category": "FOREX", "description": "US Dollar to Mexican Peso exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "CAD=X", "name": "USD/CAD", "category": "FOREX", "description": "US Dollar to Canadian Dollar exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "AUDUSD=X", "name": "AUD/USD", "category": "FOREX", "description": "Australian Dollar to US Dollar exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "CHF=X", "name": "USD/CHF", "category": "FOREX", "description": "US Dollar to Swiss Franc exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "NZDUSD=X", "name": "NZD/USD", "category": "FOREX", "description": "New Zealand Dollar to US Dollar exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "EURGBP=X", "name": "EUR/GBP", "category": "FOREX", "description": "Euro to British Pound exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"},
        {"symbol": "EURJPY=X", "name": "EUR/JPY", "category": "FOREX", "description": "Euro to Japanese Yen exchange rate.", "website": "", "logo": "", "sector": "Forex", "industry": "Forex"}
    ]
    if category:
        assets = [a for a in assets if a["category"] == category]
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
            return a  # Return full asset object with all fields
    return {"symbol": symbol, "name": symbol, "category": "STOCKS", "description": "", "website": "", "logo": "", "sector": "", "industry": ""}

@app.get("/assets/movers", dependencies=[Depends(require_api_key)])
def get_asset_movers(category: str = "STOCKS", sort: str = "volatile", limit: int = 8):
    """Get top movers by volatility or volume for a category."""
    assets = get_categorized_assets(category)
    if not assets:
        return []
    
    results = []
    for asset in assets:
        try:
            import yfinance as yf
            yf_symbol = resolve_yfinance_symbol(asset["symbol"])
            ticker = yf.Ticker(yf_symbol)
            hist = ticker.history(period="5d")
            
            if len(hist) >= 2:
                current_price = float(hist['Close'].iloc[-1])
                prev_price = float(hist['Close'].iloc[-2])
                change_value = current_price - prev_price
                change_percent = (change_value / prev_price) * 100 if prev_price > 0 else 0
                volume = float(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0
                
                # Calculate volatility (std dev of daily returns over 5 days)
                if len(hist) >= 3:
                    returns = hist['Close'].pct_change().dropna()
                    volatility = float(returns.std() * 100) if len(returns) > 1 else 0
                else:
                    volatility = abs(change_percent)
                
                results.append({
                    "symbol": asset["symbol"],
                    "name": asset["name"],
                    "price": current_price,
                    "changePercent": round(change_percent, 2),
                    "changeValue": round(change_value, 2),
                    "volume": volume,
                    "volatility": round(volatility, 2)
                })
        except Exception as e:
            print(f"Error calculating movers for {asset['symbol']}: {e}")
            continue
    
    # Sort by requested criteria
    if sort == "volatile":
        results.sort(key=lambda x: x["volatility"], reverse=True)
    elif sort == "gainers":
        results.sort(key=lambda x: x["changePercent"], reverse=True)
    elif sort == "losers":
        results.sort(key=lambda x: x["changePercent"])
    elif sort == "volume":
        results.sort(key=lambda x: x["volume"], reverse=True)
    
    return results[:limit]


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


# Background price publisher for Trading Bot - HOURLY + ON-DEMAND
async def publish_price_ticks():
    """Background task: fetch prices and publish to LOCAL Redis streams every HOUR (not 5s).
    On-demand fetching available via /price/{symbol} endpoint.
    Only publishes to LOCAL Redis (Trading Bot) - NOT Upstash."""
    import asyncio
    import yfinance as yf
    
    # Only core symbols the bot actually trades (reduce from 24 to ~10)
    core_symbols = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META",
        "BTC-USD", "ETH-USD", "SPY", "QQQ"
    ]
    
    while True:
        try:
            for symbol in core_symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period="1d")
                    if len(hist) > 0:
                        row = hist.iloc[-1]
                        price = float(row['Close'])
                        volume = float(row['Volume'])
                        oracle.publish_tick(symbol, price, volume)
                except Exception as e:
                    print(f"Error publishing tick for {symbol}: {e}")
            
            await asyncio.sleep(3600)  # Publish every HOUR (was 5 seconds)
        except Exception as e:
            print(f"Background publisher error: {e}")
            await asyncio.sleep(300)  # Retry in 5 min on error


# On-demand price fetch endpoint (user-requested symbols)
@app.get("/price/ondemand/{symbol}", dependencies=[Depends(require_api_key)])
def get_price_on_demand(symbol: str):
    """Fetch and cache a specific symbol on user request - not in background loop."""
    try:
        yf_symbol = resolve_yfinance_symbol(symbol)
        price = oracle.fetch_and_cache(yf_symbol)
        return {"symbol": symbol, "price": price, "status": "fetched_on_demand"}
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "status": "failed"}