import grpc
from concurrent import futures
from datetime import datetime
import sys
import os
import yfinance as yf
import logging
from functools import lru_cache

from src.application.price_oracle import PriceOracle

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@lru_cache(maxsize=32)
def get_eia_inventory(route: str, series: str = None) -> float:
    api_key = os.getenv("EIA_API_KEY")
    if not api_key:
        logging.warning("EIA_API_KEY not set")
        return 0.0
    url = f"https://api.eia.gov/v2/{route}/data/"
    params = {
        'api_key': api_key,
        'frequency': 'monthly',
        'data[0]': 'value',
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'offset': 0,
        'length': 1
    }
    if series:
        params['facets[series][]'] = series
    try:
        import requests
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('response') and data['response'].get('data'):
                latest = data['response']['data'][0]
                if latest.get('value') is not None:
                    return float(latest['value'])
        else:
            logging.warning(f"EIA API request failed: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        logging.warning(f"Error fetching EIA data for {route}: {e}")
    return 0.0

current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, '..')
if src_dir not in sys.path:
    sys.path.append(src_dir)

try:
    import financial_data_pb2
    import financial_data_pb2_grpc
except ImportError as e:
    logging.error(f"❌ Error importando protos: {e}")
    try:
        from src.infrastructure import financial_data_pb2
        from src.infrastructure import financial_data_pb2_grpc
    except ImportError:
        logging.error("❌ Fallo total de importación de protos.")

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
    
    # First try the symbol as-is (for US stocks and others that don't need suffix)
    try:
        t = yf.Ticker(symbol)
        # Check if we got meaningful info (has symbol or shortName)
        info = t.info
        if info and ('symbol' in info or 'shortName' in info or 'longName' in info):
            return symbol
    except Exception:
        pass
    
    # If that failed, try with LATAM suffixes
    for suffix in LATAM_SUFFIXES:
        try:
            t = yf.Ticker(symbol + suffix)
            info = t.info
            if info and ('symbol' in info or 'shortName' in info or 'longName' in info):
                return symbol + suffix
        except Exception:
            continue
    
    # Return original symbol if nothing worked
    return symbol

class FinancialDataServicer(financial_data_pb2_grpc.FinancialDataServiceServicer):

    def __init__(self):
        self.oracle = PriceOracle()

    def _get_market_cap(self, ticker, info) -> float:
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

    def GetStockPrice(self, request, context):
        symbol = request.symbol
        print(f"💰 gRPC Request received for: {symbol}")
        yf_symbol = resolve_yfinance_symbol(symbol)
        price = self.oracle.fetch_and_cache(yf_symbol)
        return financial_data_pb2.StockPriceResponse(
            symbol=symbol,
            price=price,
            timestamp=datetime.now().isoformat()
        )

    def GetBatchPrices(self, request, context):
        result = {}
        for symbol in request.symbols:
            yf_symbol = resolve_yfinance_symbol(symbol)
            price = self.oracle.fetch_and_cache(yf_symbol)
            result[symbol] = price
        return financial_data_pb2.BatchStockResponse(prices=result)

    def GetPriceHistory(self, request, context):
        symbol = request.symbol
        yf_symbol = resolve_yfinance_symbol(symbol)

        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=f"{request.days}d")
        info = ticker.info

        is_crypto = request.symbol.endswith('-USD')
        is_commodity = request.symbol.endswith('=F') or request.symbol in ['GC', 'SI', 'CL', 'NG', 'HG', 'BZ', 'PL', 'PA']

        crypto_data = {}
        commodity_data = {}

        points = []
        for date, row in hist.iterrows():
            point_data = {
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': float(row['Volume']),
                'market_cap': self._get_market_cap(ticker, info),
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
                'date': date.strftime('%Y-%m-%d'),
            }
            points.append(financial_data_pb2.PricePoint(**point_data))

        return financial_data_pb2.HistoryResponse(
            symbol=request.symbol,
            history=points
        )

    def GetCategorizedAssets(self, request, context):
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
        print("📋 gRPC Request: GetCategorizedAssets")
        proto_assets = [
            financial_data_pb2.Asset(
                symbol=a["symbol"],
                name=a["name"],
                category=a["category"],
                description="",
                website=""
            ) for a in assets
        ]
        return financial_data_pb2.CategorizedAssetsResponse(assets=proto_assets)

    def GetAvailableSymbols(self, request, context):
        print("📋 gRPC Request received for available symbols")
        popular_symbols = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "DIS",
            "EC", "AVAL", "BANCOLOMBIA", "PF", "CEMEX",
            "CIBEST", "ISA", "ETB", "BOGOTA", "CELSIA",
            "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
            "GC=F", "SI=F", "CL=F", "NG=F", "HG=F",
            "EURUSD=X", "GBPUSD=X", "USDJPY=X"
        ]
        return financial_data_pb2.SymbolsResponse(symbols=popular_symbols)

    def SearchSymbols(self, request, context):
        query = request.query.upper().strip()
        limit = request.limit
        if not query:
            return financial_data_pb2.CategorizedAssetsResponse(assets=[])
        print(f"🔍 Search request for: {query} (limit: {limit})")
        try:
            categorized = self.GetCategorizedAssets(request, context)
            query_lower = query.lower()
            matches = [a for a in categorized.assets
                       if query_lower in a.symbol.lower() or query_lower in a.name.lower()]
            if matches:
                print(f"✅ Tier 1 match for {query}")
                return financial_data_pb2.CategorizedAssetsResponse(assets=matches[:limit])
        except Exception as e:
            print(f"⚠️ Error searching categorized assets: {e}")

        yf_query = resolve_yfinance_symbol(query)
        if yf_query != query:
            try:
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
                    return financial_data_pb2.CategorizedAssetsResponse(assets=[
                        financial_data_pb2.Asset(
                            symbol=query, name=name, category=category,
                            description='', website='')
                    ])
            except Exception as e:
                print(f"⚠️ Error validating {query} via yfinance: {e}")

        print(f"❌ No results for: {query}")
        return financial_data_pb2.CategorizedAssetsResponse(assets=[])


def serve():
    try:
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        financial_data_pb2_grpc.add_FinancialDataServiceServicer_to_server(
            FinancialDataServicer(), server
        )
        server.add_insecure_port('[::]:50051')
        logging.info("🚀 gRPC Server starting on port 50051...")
        server.start()
        server.wait_for_termination()
    except Exception as e:
        logging.error(f"❌ Error fatal en el servidor gRPC: {e}")
        raise e

if __name__ == '__main__':
    serve()
