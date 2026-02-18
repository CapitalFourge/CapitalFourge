from typing import Any
from typing import Dict
from typing import List
import os
from fastapi import FastAPI
from dotenv import load_dotenv
import threading
from src.infrastructure.grpc_server import serve
from src.infrastructure.mongo_repository import MongoFinancialDataRepository
from src.infrastructure.polars_processor import PolarsDataProcessor
from src.application.services import FinancialDataService
from src.application.price_oracle import PriceOracle

load_dotenv(dotenv_path="../.env")
app = FastAPI(title="FinSight Data Collector")

# 2. Configurar la Infraestructura (Adaptadores)
mongo_host = os.getenv("DB_MONGO_HOST", "localhost")
mongo_pass = os.getenv("DB_MONGO_ROOT_PASSWORD")
uri = f"mongodb://admin:{mongo_pass}@{mongo_host}:27017/?authSource=admin"

repo = MongoFinancialDataRepository(connection_string=uri, database_name="finsight_data")
processor = PolarsDataProcessor()
service = FinancialDataService(repository=repo, processor=processor)
oracle = PriceOracle()
print("🛰️ Iniciando servidor gRPC en hilo secundario...")
grpc_thread = threading.Thread(target=serve, daemon=True)
grpc_thread.start()

@app.get("/health")
def health_check():
    return {"status": "alive","service": "data_collector"}

@app.post("/collect/batch")
def collect_batch(data: List[Dict[str, Any]]):
    count = service.process_and_store_batch(data)
    return {"message": f"Successfully processed and stored {count} records using Polars"}

@app.post("/collect/{symbol}")
def collect_data(symbol: str, price: float):
    success = service.collect_and_store(symbol,price)
    if success:
        return {"message": f"Data for {symbol} stored successfully"}
    return {"message": "Failed to store data", "status": 500}

@app.get("/price/{symbol}")
def sync_price(symbol: str):
    price = oracle.fetch_and_cache(symbol)
    if price > 0:
        return {"symbol": symbol, "price": price, "status": "synchronized"}
    return {"error": "Symbol not found", "status": 404}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)