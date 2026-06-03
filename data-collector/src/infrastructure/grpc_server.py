import grpc
from concurrent import futures
import time
from datetime import datetime
import sys
import os
import yfinance as yf
import logging
from functools import lru_cache

# Configurar logging basico
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# EIA API integration for commodity inventory data
@lru_cache(maxsize=32)
def get_eia_inventory(route: str, series: str = None) -> float:
    """Fetch latest inventory value from EIA API."""
    api_key = os.getenv("EIA_API_KEY")
    if not api_key:
        logging.warning("EIA_API_KEY not set")
        return 0.0
    # Use EIA API v2 endpoint
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
                series_data = data['response']['data']
                if len(series_data) > 0:
                    # Get the most recent data point (first in list due to sorting)
                    latest = series_data[0]
                    if latest.get('value') is not None:
                        return float(latest['value'])
            else:
                logging.warning(f"EIA API request failed: {response.status_code} - {response.text[:100]}")
        else:
            logging.warning(f"EIA API request failed: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        logging.warning(f"Error fetching EIA data for {route}: {e}")
    return 0.0
# Configurar logging básico
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Asegurar que el directorio src esté en el path para los protos generados
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, '..')
if src_dir not in sys.path:
    sys.path.append(src_dir)

try:
    import financial_data_pb2
    import financial_data_pb2_grpc
except ImportError as e:
    logging.error(f"❌ Error importando protos: {e}")
    # Intento de respaldo para entornos donde src.infrastructure sea necesario
    try:
        from src.infrastructure import financial_data_pb2
        from src.infrastructure import financial_data_pb2_grpc
    except ImportError:
        logging.error("❌ Fallo total de importación de protos.")

from src.application.price_oracle import PriceOracle

class FinancialDataServicer(financial_data_pb2_grpc.FinancialDataServiceServicer):
    
    def __init__(self):
        self.oracle = PriceOracle()

    def GetStockPrice(self, request, context):
        symbol = request.symbol
        print(f"💰 gRPC Request received for: {symbol}")
        price = self.oracle.fetch_and_cache(symbol)
        return financial_data_pb2.StockPriceResponse(
            symbol=symbol,
            price=price,
            timestamp=datetime.now().isoformat()
        )
    def GetBatchPrices(self, request, context):
        result = {}
        for symbol in request.symbols:
            price = self.oracle.fetch_and_cache(symbol)
            result[symbol] = price

        return financial_data_pb2.BatchStockResponse(prices=result) 

def GetPriceHistory(self, request, context):
         # Map Colombian symbols to yfinance format
         symbol = request.symbol
         colombian_map = {
             'EC': 'ECOL.BOG',  # Ecopetrol en yfinance
             'ECOL': 'ECOL.BOG',
             'AVAL': 'AVAL.BOG',
             'BANCOLOMBIA': 'BANCOLOMBIA.BOG',
             'PF': 'PFAVAL.BOG',  # Pfizer/Grupo Aval
             'CEMEX': 'CEMEX.BOG',
         }
         yf_symbol = colombian_map.get(symbol, symbol)
         
         ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=f"{request.days}d")
        info = ticker.info  # Get fundamental data
        
        # Check symbol type
        is_crypto = request.symbol.endswith('-USD')
        is_commodity = request.symbol.endswith('=F') or request.symbol in ['GC', 'SI', 'CL', 'NG', 'HG', 'BZ', 'PL', 'PA']
        
        # Initialize data sources
        crypto_data = {}
        commodity_data = {}
        
        # For crypto, get additional data from CoinGecko
        if is_crypto:
            try:
                import requests
                # Convert symbol format: BTC-USD -> bitcoin
                coin_id = request.symbol.replace('-USD', '').lower()
                # Map common symbols to CoinGecko IDs
                coin_id_map = {
                    'btc': 'bitcoin',
                    'eth': 'ethereum',
                    'sol': 'solana',
                    'ada': 'cardano',
                    'dot': 'polkadot',
                    'xrp': 'ripple',
                    'doge': 'dogecoin',
                    'matic': 'polygon',
                    'link': 'chainlink',
                    'avax': 'avalanche-2'
                }
                coin_id = coin_id_map.get(coin_id, coin_id)
                
                # Fetch from CoinGecko API
                url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
                params = {
                    'localization': 'false',
                    'tickers': 'false',
                    'market_data': 'true',
                    'community_data': 'false',
                    'developer_data': 'false',
                    'sparkline': 'false'
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    crypto_data = response.json()
            except Exception as e:
                print(f"⚠️  Error fetching crypto data for {request.symbol}: {e}")
                crypto_data = {}
        
        # For commodities, get additional data from various sources
        if is_commodity:
            try:
                import requests
                import time
                
                # Map commodity symbols to data sources
                commodity_map = {
                    'GC=F': {'name': 'gold', 'type': 'metal'},
                    'SI=F': {'name': 'silver', 'type': 'metal'},
                    'HG=F': {'name': 'copper', 'type': 'metal'},
                    'PL=F': {'name': 'platinum', 'type': 'metal'},
                    'PA=F': {'name': 'palladium', 'type': 'metal'},
                    'CL=F': {'name': 'WTI crude oil', 'type': 'energy', 'eia_route': 'petroleum/stoc/cu', 'eia_series': 'MCRST_YCUOK_1'},  # Cushing OK Ending Stocks of Crude Oil
                    'BZ=F': {'name': 'Brent crude oil', 'type': 'energy'},  # Brent doesn't have direct EIA equivalent, use WTI as proxy or find appropriate series
                    'NG=F': {'name': 'Natural Gas', 'type': 'energy', 'eia_route': 'petroleum/stoc/cu', 'eia_series': 'NG.NW2_EPG0_SWO_R48_BCF.W'},  # Natural Gas Working Underground Storage
                }
                
                commodity_info = commodity_map.get(request.symbol)
                if commodity_info:
                    # Get basic commodity data from yfinance info (already have some)
                    # Try to get additional data from specialized APIs
                    
                    # For metals, try to get mining cost data
                    if commodity_info['type'] == 'metal':
                        # Placeholder for metals-specific data
                        # In production, would integrate with Kitco, S&P Global, etc.
                        commodity_data = {
                            'cost_of_production': 0.0,  # Would get from mining reports
                            'all_in_sustaining_cost': 0.0,  # AISC for gold miners
                            'inventory_levels': 0.0,  # Would get from exchange inventories
                        }
                    
                    # For energy, try to get inventory data from EIA
                    elif commodity_info['type'] == 'energy':
                        # Get inventory data from EIA if series_id is available
                        inventory_levels = 0.0
                        if 'eia_route' in commodity_info and 'eia_series' in commodity_info:
                            inventory_levels = get_eia_inventory(commodity_info['eia_route'], commodity_info['eia_series'])
                        
                        commodity_data = {
                            'inventory_levels': inventory_levels,  # From EIA weekly reports
                            'opec_spare_capacity': 0.0,  # Would get from OPEC/JODI data
                            'reserve_replacement_ratio': 0.0,  # For oil companies
                        }
                        
            except Exception as e:
                print(f"⚠️  Error fetching commodity data for {request.symbol}: {e}")
                commodity_data = {}
        
        points = []
        for date, row in hist.iterrows():
            # Base fields from Yahoo Finance (work for all asset types)
            point_data = {
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': float(row['Volume']),
                'market_cap': float(info.get('marketCap', 0)) if info.get('marketCap') else 0.0,
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
            
            # Add crypto-specific data if available
            if is_crypto and crypto_data:
                market_data = crypto_data.get('market_data', {})
                point_data.update({
                    'circulating_supply': float(market_data.get('circulating_supply', 0)) if market_data.get('circulating_supply') else 0.0,
                    'total_supply': float(market_data.get('total_supply', 0)) if market_data.get('total_supply') else 0.0,
                    'max_supply': float(market_data.get('max_supply', 0)) if market_data.get('max_supply') else 0.0,
                    'inflation_rate': 0.0,  # Would need to calculate from supply changes
                    'fdv': float(market_data.get('market_cap', {}).get('usd', 0)) * (float(market_data.get('max_supply', 0)) / float(market_data.get('circulating_supply', 1))) if market_data.get('max_supply') and market_data.get('circulating_supply') and market_data.get('market_cap', {}).get('usd') else 0.0,
                    'active_addresses': 0.0,  # Not available in free CoinGecko API
                    'transaction_volume': float(market_data.get('total_volume', {}).get('usd', 0)) if market_data.get('total_volume', {}).get('usd') else 0.0,
                    'transaction_count': 0.0,  # Not available in free CoinGecko API
                    'fees_generated': 0.0,  # Not available in free CoinGecko API
                    'tvl': 0.0,  # Would need DeFi Llama or similar
                    'hash_rate': 0.0,  # Would need blockchain.info or similar
                    'staking_ratio': 0.0,  # Would need specific API
                    'nakamoto_coefficient': 0.0,  # Would need specific API
                    'order_book_depth': 0.0,  # Would need exchange API
                    'developer_activity': 0.0,  # Would need GitHub API or CoinGecko developer data
                    'user_growth': 0.0,  # Would need to calculate from active addresses
                    'revenue': 0.0,  # Not directly applicable to most crypto
                    'price_to_fees_ratio': 0.0,  # Would need fees data
                    'bitcoin_dominance': 0.0,  # Would need global data endpoint
                    'fear_greed_index': 0.0,  # Would need alternative.me API
                })
                
                # Calculate FDV properly if we have the data
                if market_data.get('max_supply') and market_data.get('market_cap', {}).get('usd'):
                    point_data['fdv'] = float(market_data['market_cap']['usd']) * (float(market_data['max_supply']) / float(market_data.get('circulating_supply', 1))) if market_data.get('circulating_supply') else 0.0
                
                # Get Bitcoin dominance from global data
                try:
                    global_url = "https://api.coingecko.com/api/v3/global"
                    global_response = requests.get(global_url, timeout=10)
                    if global_response.status_code == 200:
                        global_data = global_response.json()
                        point_data['bitcoin_dominance'] = float(global_data.get('data', {}).get('market_cap_percentage', {}).get('btc', 0))
                except:
                    pass
                   
                # Get Fear and Greed Index
                try:
                    fg_url = "https://api.alternative.me/fng/"
                    fg_response = requests.get(fg_url, timeout=10)
                    if fg_response.status_code == 200:
                        fg_data = fg_response.json()
                        if fg_data.get('data'):
                            point_data['fear_greed_index'] = float(fg_data['data'][0].get('value', 0))
                except:
                    pass
            
            # Add commodity-specific data if available
            if is_commodity and commodity_data:
                point_data.update(commodity_data)
                
                # Calculate commodity-specific metrics
                # For simplicity, setting placeholders that would be calculated from real data
                if request.symbol in ['GC=F', 'SI=F', 'HG=F', 'PL=F', 'PA=F']:  # Metals
                    point_data.update({
                        'cost_of_production': 0.0,  # Placeholder
                        'all_in_sustaining_cost': 0.0,  # Placeholder
                        'inventory_levels': 0.0,  # Would come from COMEX/LME data
                    })
                elif request.symbol in ['BZ=F', 'NG=F']:  # Energy (excluding CL=F which already has correct inventory_levels)
                    point_data.update({
                        'inventory_levels': 0.0,  # Would come from EIA
                        'opec_spare_capacity': 0.0,  # Would come from OPEC/JODI
                        'reserve_replacement_ratio': 0.0,  # Would come from oil company reports
                    })
                # CL=F inventory_levels is already set correctly from commodity_data above
                
                # Common commodity metrics
                point_data.update({
                    'contango_backwardation': 0.0,  # Would calculate from futures curve
                    'dollar_index_exposure': 0.0,  # Would calculate correlation with DXY
                    'inflation_correlation': 0.0,  # Would calculate correlation with CPI/TIPS
                    'chinese_demand_index': 0.0,  # Would use Chinese PMI manufacturing
                    'weather_index': 0.0,  # Would use NOAA/USDA data for agricommodities
                })
            
            points.append(financial_data_pb2.PricePoint(**point_data))
        
        return financial_data_pb2.HistoryResponse(
            symbol=request.symbol,
            history=points
        )

def GetCategorizedAssets(self, request, context):
         # Lista de activos categorizados
         assets = [
             # Stocks
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
             # Colombian stocks
             {"symbol": "EC", "name": "Ecopetrol S.A.", "category": "STOCKS"},
             {"symbol": "AVAL", "name": "Grupo Aval Acciones y Valores", "category": "STOCKS"},
             {"symbol": "BANCOLOMBIA", "name": "Bancolombia S.A.", "category": "STOCKS"},
             {"symbol": "PF", "name": "Pfizer S.A.", "category": "STOCKS"},
             {"symbol": "CEMEX", "name": "CEMEX S.A.", "category": "STOCKS"},
             
             # Crypto
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
             
             # Commodities
             {"symbol": "GC=F", "name": "Gold", "category": "COMMODITIES"},
             {"symbol": "SI=F", "name": "Silver", "category": "COMMODITIES"},
             {"symbol": "CL=F", "name": "Crude Oil", "category": "COMMODITIES"},
             {"symbol": "NG=F", "name": "Natural Gas", "category": "COMMODITIES"},
             {"symbol": "HG=F", "name": "Copper", "category": "COMMODITIES"},
             {"symbol": "BZ=F", "name": "Brent Crude Oil", "category": "COMMODITIES"},
             {"symbol": "PL=F", "name": "Platinum", "category": "COMMODITIES"},
             {"symbol": "PA=F", "name": "Palladium", "category": "COMMODITIES"},
             
             # Forex
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
        
        print(f"📋 gRPC Request: GetCategorizedAssets")
        
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
         print(f"📋 gRPC Request received for available symbols")
         # Return curated list of popular symbols for autocomplete
         # This helps users discover common assets while still allowing custom searches
         popular_symbols = [
             "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "DIS",
             "EC", "AVAL", "BANCOLOMBIA", "PF", "CEMEX",  # Colombian stocks
             "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
             "GC=F", "SI=F", "CL=F", "NG=F", "HG=F",
             "EURUSD=X", "GBPUSD=X", "USDJPY=X"
         ]
         return financial_data_pb2.SymbolsResponse(symbols=popular_symbols)

def SearchSymbols(self, request, context):
         # Allow searching any symbol - validate with yfinance if it exists
         query = request.query.upper()
         print(f"🔍 Search request for: {query}")
         
         # Colombian stocks mapping to yfinance format
         colombian_map = {
             'EC': 'ECOL.BOG', 'ECOPETROL': 'ECOL.BOG',
             'AVAL': 'AVAL.BOG',
             'BANCOLOMBIA': 'BANCOLOMBIA.BOG', 'BANCO': 'BANCOLOMBIA.BOG',
             'PF': 'PFAVAL.BOG',
             'CEMEX': 'CEMEX.BOG',
         }
         
         yf_query = colombian_map.get(query, query)
         is_colombian = query in colombian_map
         
         # Try to validate the symbol exists in yfinance
         try:
             ticker = yf.Ticker(yf_query)
             info = ticker.info
             name = info.get('shortName') or info.get('longName') or info.get('displayName')
             
             if name or ticker.fast_info:
                 # Symbol is valid, return it with original query symbol
                 proto_assets = [financial_data_pb2.Asset(
                     symbol=query,
                     name=name,
                     category="STOCKS" if is_colombian else "",  # Colombian stocks are STOCKS
                     description="",
                     website=""
                 )]
                 print(f"✅ Valid symbol found: {query} -> {name}")
             else:
                 proto_assets = []
         except Exception as e:
             print(f"⚠️ Error validating symbol {query}: {e}")
             proto_assets = []
         
         return financial_data_pb2.CategorizedAssetsResponse(assets=proto_assets)

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