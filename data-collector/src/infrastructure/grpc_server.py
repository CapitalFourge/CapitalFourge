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

    def GetAvailableSymbols(self, request, context):
        # Lista de símbolos disponibles - esto podría extenderse para consultar
        # una base de datos o API externa en el futuro
        available_symbols = [
            # Stocks
            "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "JPM", "V", "WMT",
            "DIS", "NFLX", "INTC", "AMD", "PYPL", "ADBE", "CRM", "ORCL", "IBM",
            "BA", "GS", "HD", "LOW", "NKE", "PFE", "T", "VZ", "WFC",
            # Crypto (simple format)
            "BTC", "ETH", "SOL", "ADA", "DOT", "XRP", "DOGE", "SHIB", "MATIC", "AVAX",
            "LINK", "UNI", "AAVE",
            # Crypto (USD format for Yahoo Finance)
            "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
            "DOGE-USD", "SHIB-USD", "MATIC-USD", "AVAX-USD", "LINK-USD", "UNI-USD", "AAVE-USD"
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