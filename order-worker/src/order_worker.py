#!/usr/bin/env python3
"""
Order Worker - Handles order fill and order expiry for Capital Fourge limit orders.

Two main jobs:
1. Order Fill Engine - Monitors market prices and executes BUY_LIMIT orders when marketPrice >= targetPrice
2. Order Expiry Job - Marks orders as EXPIRED and releases locked balance when expiresAt passes
"""

import os
import sys
import time
import logging
import threading
from datetime import datetime, timezone
from typing import List, Dict, Optional
from dataclasses import dataclass

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn

load_dotenv(dotenv_path="../.env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("order-worker")

# Configuration
GRAPHQL_ENDPOINT = os.getenv("ORDER_WORKER_GRAPHQL_ENDPOINT", "http://api.capitalfourge.com/graphql")
SERVICE_API_KEY = os.getenv("SERVICE_API_KEY", "internal-service-key")
ORDER_FILL_INTERVAL = int(os.getenv("ORDER_FILL_INTERVAL_SECONDS", "30"))  # Check every 30s
ORDER_EXPIRY_INTERVAL = int(os.getenv("ORDER_EXPIRY_INTERVAL_SECONDS", "60"))  # Check every 60s

# FastAPI app for health checks
app = FastAPI(title="Order Worker")


@app.get("/health")
def health_check():
    return {"status": "alive", "service": "order-worker", "version": "1.0.0"}


@app.get("/")
def root():
    return {"status": "alive", "service": "order-worker", "version": "1.0.0"}


def run_fastapi():
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="warning")


@dataclass
class Order:
    id: str
    portfolio_id: str
    user_id: str
    type: str  # BUY_LIMIT, SELL_LIMIT
    symbol: str
    target_price: float
    quantity: float
    status: str  # PENDING, FILLED, CANCELLED, EXPIRED
    created_at: str
    expires_at: Optional[str]


@dataclass
class Portfolio:
    id: str
    name: str
    cash_balance: float
    locked_balance: float


class GraphQLClient:
    """Simple GraphQL client for order worker operations."""

    def __init__(self, endpoint: str, api_key: str):
        self.endpoint = endpoint
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": api_key
        }

    def execute(self, query: str, variables: dict = None) -> dict:
        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        response = requests.post(self.endpoint, json=payload, headers=self.headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            raise Exception(f"GraphQL errors: {data['errors']}")

        return data.get("data", {})


class OrderFillEngine:
    """Monitors market prices and fills BUY_LIMIT orders when conditions are met."""

    def __init__(self, gql_client: GraphQLClient):
        self.gql = gql_client

    def get_pending_buy_orders(self) -> List[Order]:
        """Fetch all PENDING BUY_LIMIT orders."""
        query = """
        query GetPendingBuyOrders {
            pendingLimitOrders {
                id
                portfolioId
                userId
                type
                symbol
                targetPrice
                quantity
                status
                createdAt
                expiresAt
            }
        }
        """
        data = self.gql.execute(query)
        orders = []
        for order_data in data.get("pendingLimitOrders", []):
            if order_data.get("type") == "BUY_LIMIT" and order_data.get("status") == "PENDING":
                orders.append(Order(
                    id=order_data["id"],
                    portfolio_id=order_data["portfolioId"],
                    user_id=order_data["userId"],
                    type=order_data["type"],
                    symbol=order_data["symbol"],
                    target_price=order_data["targetPrice"],
                    quantity=order_data["quantity"],
                    status=order_data["status"],
                    created_at=order_data.get("createdAt"),
                    expires_at=order_data.get("expiresAt")
                ))
        return orders

    def get_current_price(self, symbol: str) -> Optional[float]:
        """Get current market price from data collector."""
        try:
            # Use data collector's price endpoint
            collector_url = os.getenv("DATA_COLLECTOR_URL", "http://data-collector:8000")
            response = requests.get(
                f"{collector_url}/price/{symbol}",
                headers={"X-API-Key": SERVICE_API_KEY},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return float(data.get("price", 0))
        except Exception as e:
            logger.warning(f"Failed to get price for {symbol}: {e}")
        return None

    def fill_order(self, order: Order, fill_price: float) -> bool:
        """Execute order fill via GraphQL mutation."""
        mutation = """
        mutation FillLimitOrder($orderId: ID!, $fillPrice: Float!) {
            fillLimitOrder(orderId: $orderId, fillPrice: $fillPrice) {
                id
                status
            }
        }
        """
        try:
            self.gql.execute(mutation, {"orderId": order.id, "fillPrice": fill_price})
            logger.info(f"✅ Filled order {order.id}: {order.quantity} {order.symbol} @ ${fill_price}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to fill order {order.id}: {e}")
            return False

    def run_fill_check(self):
        """Main fill check loop."""
        logger.info("🔍 Checking for fillable BUY_LIMIT orders...")

        orders = self.get_pending_buy_orders()
        if not orders:
            logger.info("   No pending BUY_LIMIT orders")
            return

        logger.info(f"   Found {len(orders)} pending BUY_LIMIT orders")

        for order in orders:
            current_price = self.get_current_price(order.symbol)
            if current_price is None:
                logger.warning(f"   Could not get price for {order.symbol}")
                continue

            logger.info(f"   {order.symbol}: target=${order.target_price:.2f}, current=${current_price:.2f}")

            # BUY_LIMIT fills when market price <= target price (price dropped to target)
            if current_price <= order.target_price:
                logger.info(f"   🎯 TRIGGER: {order.symbol} @ ${current_price:.2f} <= ${order.target_price:.2f}")
                # Paper trading: execute at exact limit price (target_price), not market price
                self.fill_order(order, order.target_price)
            else:
                logger.info(f"   ⏳ Waiting: {order.symbol} @ ${current_price:.2f} > ${order.target_price:.2f}")


class OrderExpiryJob:
    """Marks expired orders as EXPIRED and releases locked balance."""

    def __init__(self, gql_client: GraphQLClient):
        self.gql = gql_client

    def get_expired_orders(self) -> List[Order]:
        """Fetch all PENDING orders past their expiresAt."""
        query = """
        query GetPendingOrders {
            pendingLimitOrders {
                id
                portfolioId
                userId
                type
                symbol
                targetPrice
                quantity
                status
                createdAt
                expiresAt
            }
        }
        """
        data = self.gql.execute(query)
        orders = []
        now = datetime.now(timezone.utc)

        for order_data in data.get("pendingLimitOrders", []):
            if order_data["status"] == "PENDING" and order_data.get("expiresAt"):
                expires_str = order_data["expiresAt"].replace("Z", "+00:00")
                expires = datetime.fromisoformat(expires_str)
                if expires.tzinfo is None:
                    expires = expires.replace(tzinfo=timezone.utc)
                if expires < now:
                    orders.append(Order(
                        id=order_data["id"],
                        portfolio_id=order_data["portfolioId"],
                        user_id=order_data["userId"],
                        type=order_data["type"],
                        symbol=order_data["symbol"],
                        target_price=order_data["targetPrice"],
                        quantity=order_data["quantity"],
                        status=order_data["status"],
                        created_at=order_data["createdAt"],
                        expires_at=order_data.get("expiresAt")
                    ))
        return orders

    def expire_order(self, order: Order) -> bool:
        """Mark order as EXPIRED via GraphQL mutation."""
        mutation = """
        mutation ExpireLimitOrder($orderId: ID!) {
            expireLimitOrder(orderId: $orderId) {
                id
                status
            }
        }
        """
        try:
            self.gql.execute(mutation, {"orderId": order.id})
            logger.info(f"⏰ Expired order {order.id}: {order.quantity} {order.symbol} (was ${order.target_price})")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to expire order {order.id}: {e}")
            return False

    def run_expiry_check(self):
        """Main expiry check loop."""
        logger.info("⏰ Checking for expired limit orders...")

        orders = self.get_expired_orders()
        if not orders:
            logger.info("   No expired orders")
            return

        logger.info(f"   Found {len(orders)} expired orders")

        for order in orders:
            logger.info(f"   Expiring {order.id}: {order.symbol} @ ${order.target_price} (expired {order.expires_at})")
            self.expire_order(order)


def main():
    logger.info("=" * 60)
    logger.info("🚀 Capital Fourge Order Worker Starting")
    logger.info(f"   GraphQL: {GRAPHQL_ENDPOINT}")
    logger.info(f"   Fill interval: {ORDER_FILL_INTERVAL}s")
    logger.info(f"   Expiry interval: {ORDER_EXPIRY_INTERVAL}s")
    logger.info("=" * 60)

    gql_client = GraphQLClient(GRAPHQL_ENDPOINT, SERVICE_API_KEY)

    fill_engine = OrderFillEngine(gql_client)
    expiry_job = OrderExpiryJob(gql_client)

    scheduler = BackgroundScheduler(daemon=True)

    # Order fill check - every 30 seconds
    scheduler.add_job(
        fill_engine.run_fill_check,
        IntervalTrigger(seconds=ORDER_FILL_INTERVAL),
        id="order_fill",
        max_instances=1,
        coalesce=True
    )

    # Order expiry check - every 60 seconds
    scheduler.add_job(
        expiry_job.run_expiry_check,
        IntervalTrigger(seconds=ORDER_EXPIRY_INTERVAL),
        id="order_expiry",
        max_instances=1,
        coalesce=True
    )

    scheduler.start()
    logger.info("✅ Scheduler started")

    # Run once on startup
    fill_engine.run_fill_check()
    expiry_job.run_expiry_check()

    # Start FastAPI server in background thread
    fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)
    fastapi_thread.start()
    logger.info("✅ FastAPI health server started on port 8080")

    # Keep running
    try:
        while True:
            time.sleep(60)
            logger.debug("💓 Order worker heartbeat")
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down order worker...")
        scheduler.shutdown()


if __name__ == "__main__":
    main()