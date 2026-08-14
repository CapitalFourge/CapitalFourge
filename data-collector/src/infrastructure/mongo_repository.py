from pymongo import MongoClient
from src.domain.models import FinancialData
from src.application.ports import FinancialDataRepository
from datetime import datetime
from typing import List, Dict, Any, Optional

class MongoFinancialDataRepository(FinancialDataRepository):
    def __init__(self, connection_string: str, database_name: str):
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        self.collection = self.db["market_prices"]
        self.movers_collection = self.db["market_movers"]

    def save(self, data: FinancialData) -> bool:
        document = {
            "symbol": data.symbol,
            "price": data.price,
            "timestamp": data.timestamp,
            "metadata": data.metadata
        }
        result = self.collection.insert_one(document)
        return result.acknowledged
    
    def save_market_movers(self, movers: Dict[str, List[Dict[str, Any]]]) -> bool:
        """Save pre-computed market movers (gainers, losers, most_active)."""
        document = {
            "gainers": movers.get("gainers", []),
            "losers": movers.get("losers", []),
            "most_active": movers.get("most_active", []),
            "updated_at": datetime.utcnow()
        }
        # Upsert - keep only latest document
        result = self.movers_collection.replace_one(
            {"_id": "latest_movers"},
            document,
            upsert=True
        )
        return result.acknowledged
    
    def get_market_movers(self) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Get latest pre-computed market movers."""
        doc = self.movers_collection.find_one({"_id": "latest_movers"})
        if not doc:
            return None
        return {
            "gainers": doc.get("gainers", []),
            "losers": doc.get("losers", []),
            "most_active": doc.get("most_active", []),
            "updated_at": doc.get("updated_at")
        }
