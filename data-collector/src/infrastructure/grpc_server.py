import grpc
from concurrent import futures
import time
from datetime import datetime
import sys
import os
import yfinance as yf

import logging

# Configurar logging basico
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Asegurar que el directorio actual esté en el path para los protos generados
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

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
        ticker = yf.Ticker(request.symbol)
        hist = ticker.history(period=f"{request.days}d")
        
        points = []
        for date, row in hist.iterrows():
            points.append(financial_data_pb2.PricePoint(
                price=float(row['Close']),
                date=date.strftime('%Y-%m-%d')
            ))
            
        return financial_data_pb2.HistoryResponse(
            symbol=request.symbol,
            history=points
        )

    def GetCategorizedAssets(self, request, context):
        # Lista de activos categorizados
        assets = [
            # Stocks
            {"symbol": "AAPL", "name": "Apple Inc.", "category": "STOCKS"},
            {"symbol": "GOOGL", "name": "Alphabet Inc.", "category": "STOCKS"},
            {"symbol": "MSFT", "name": "Microsoft Corp.", "category": "STOCKS"},
            {"symbol": "AMZN", "name": "Amazon.com Inc.", "category": "STOCKS"},
            {"symbol": "TSLA", "name": "Tesla, Inc.", "category": "STOCKS"},
            {"symbol": "NVDA", "name": "NVIDIA Corporation", "category": "STOCKS"},
            {"symbol": "NFLX", "name": "Netflix, Inc.", "category": "STOCKS"},
            {"symbol": "AMD", "name": "Advanced Micro Devices", "category": "STOCKS"},
            {"symbol": "META", "name": "Meta Platforms, Inc.", "category": "STOCKS"},
            
            # Crypto
            {"symbol": "BTC-USD", "name": "Bitcoin", "category": "CRYPTO"},
            {"symbol": "ETH-USD", "name": "Ethereum", "category": "CRYPTO"},
            {"symbol": "SOL-USD", "name": "Solana", "category": "CRYPTO"},
            {"symbol": "ADA-USD", "name": "Cardano", "category": "CRYPTO"},
            {"symbol": "DOT-USD", "name": "Polkadot", "category": "CRYPTO"},
            {"symbol": "XRP-USD", "name": "XRP", "category": "CRYPTO"},
            
            # Commodities
            {"symbol": "XAUUSD=C", "name": "Gold", "category": "COMMODITIES"},
            {"symbol": "XAGUSD=C", "name": "Silver", "category": "COMMODITIES"},
            {"symbol": "CL=F", "name": "Crude Oil", "category": "COMMODITIES"},
            {"symbol": "NG=F", "name": "Natural Gas", "category": "COMMODITIES"},
            {"symbol": "GC=F", "name": "Gold Futures", "category": "COMMODITIES"},
            
            # Forex
            {"symbol": "EURUSD=X", "name": "EUR/USD", "category": "FOREX"},
            {"symbol": "GBPUSD=X", "name": "GBP/USD", "category": "FOREX"},
            {"symbol": "JPY=X", "name": "USD/JPY", "category": "FOREX"},
            {"symbol": "MXN=X", "name": "USD/MXN", "category": "FOREX"}
        ]
        
        print(f"📋 gRPC Request: GetCategorizedAssets")
        
        proto_assets = [
            financial_data_pb2.Asset(
                symbol=a["symbol"],
                name=a["name"],
                category=a["category"]
            ) for a in assets
        ]
        
        return financial_data_pb2.CategorizedAssetsResponse(assets=proto_assets)

    def GetAvailableSymbols(self, request, context):
        # Para compatibilidad, extraemos solo los símbolos de la lista anterior
        available_symbols = [
            "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD",
            "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
            "XAUUSD=C", "XAGUSD=C", "CL=F", "NG=F", "EURUSD=X", "GBPUSD=X"
        ]
        print(f"📋 gRPC Request received for available symbols")
        return financial_data_pb2.SymbolsResponse(symbols=available_symbols)

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