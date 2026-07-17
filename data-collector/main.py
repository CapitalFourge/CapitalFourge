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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# === NUEVOS ENDPOINTS REST PARA REEMPLAZAR gRPC ===
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

@app.get("/prices/batch", dependencies=[Depends(require_api_key)])
def get_batch_prices(symbols: str):
    """GET /prices/batch?symbols=AAPL,MSFT,BTC-USD"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    return grpc_client.getBatchPrices(symbol_list)

@app.get("/price/history/{symbol}", dependencies=[Depends(require_api_key)])
def get_price_history(symbol: str, days: int = 30):
    return grpc_client.getPriceHistory(symbol, days)

@app.get("/assets/categorized", dependencies=[Depends(require_api_key)])
def get_categorized_assets():
    return grpc_client.getCategorizedAssets()

@app.get("/assets/symbols", dependencies=[Depends(require_api_key)])
def get_available_symbols():
    return grpc_client.getAllAvailableSymbols()

@app.post("/assets/search", dependencies=[Depends(require_api_key)])
def search_symbols(request: SearchRequest):
    return grpc_client.searchSymbols(request.query, request.limit)

@app.get("/asset/name/{symbol}", dependencies=[Depends(require_api_key)])
def get_asset_name(symbol: str):
    name = grpc_client.getAssetName(symbol)
    return {"symbol": symbol, "name": name}

# Cliente gRPC interno para reutilizar la lógica existente
class InternalGrpcClient:
    def __init__(self):
        import grpc
        from src.infrastructure import financial_data_pb2, financial_data_pb2_grpc
        # Conectar al gRPC local (mismo proceso)
        self.channel = grpc.insecure_channel('localhost:50051')
        self.stub = financial_data_pb2_grpc.FinancialDataServiceStub(self.channel)
    
    def getBatchPrices(self, symbols: List[str]) -> dict:
        try:
            request = financial_data_pb2.BatchStockRequest(symbols=symbols)
            response = self.stub.GetBatchPrices(request)
            return {"prices": dict(response.prices)}
        except Exception as e:
            return {"prices": {}, "error": str(e)}
    
    def getPriceHistory(self, symbol: str, days: int) -> list:
        try:
            request = financial_data_pb2.HistoryRequest(symbol=symbol, days=days)
            response = self.stub.GetPriceHistory(request)
            return [{"timestamp": p.timestamp, "price": p.price, "volume": p.volume} for p in response.history]
        except Exception as e:
            return [{"error": str(e)}]
    
    def getCategorizedAssets(self) -> list:
        try:
            request = financial_data_pb2.EmptyRequest()
            response = self.stub.GetCategorizedAssets(request)
            return [{"symbol": a.symbol, "name": a.name, "category": a.category} for a in response.assets]
        except Exception as e:
            return [{"error": str(e)}]
    
    def getAllAvailableSymbols(self) -> list:
        try:
            request = financial_data_pb2.EmptyRequest()
            response = self.stub.GetAvailableSymbols(request)
            return list(response.symbols)
        except Exception as e:
            return [str(e)]
    
    def searchSymbols(self, query: str, limit: int) -> list:
        try:
            request = financial_data_pb2.SearchRequest(query=query, limit=limit)
            response = self.stub.SearchSymbols(request)
            return [{"symbol": a.symbol, "name": a.name, "category": a.category} for a in response.assets]
        except Exception as e:
            return [{"error": str(e)}]
    
    def getAssetName(self, symbol: str) -> str:
        try:
            request = financial_data_pb2.StockRequest(symbol=symbol)
            response = self.stub.GetStockPrice(request)
            return response.symbol  # fallback
        except Exception:
            return symbol

# Instanciar cliente interno
grpc_client = InternalGrpcClient()

