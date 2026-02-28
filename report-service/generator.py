#!/usr/bin/env python3
"""Portfolio PDF Report Generator (Python CLI)

Usage:
  python report-service/generator.py <portfolio_json_path> <output_pdf_path>
"""

import sys
import json
from pathlib import Path

def generate_pdf(portfolio: dict, output_path: Path) -> None:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except Exception:
        print("Missing dependency: reportlab. Install with: pip install reportlab")
        sys.exit(3)
    c = canvas.Canvas(str(output_path), pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    title = portfolio.get("name", "Portfolio Report")
    c.drawString(72, 720, f"Portfolio Report - {title}")

    c.setFont("Helvetica", 12)
    total_value = portfolio.get("totalValue") or portfolio.get("total_value") or "N/A"
    c.drawString(72, 700, f"Total Value: {total_value}")

    positions = portfolio.get("positions", []) or []
    c.drawString(72, 680, f"Active Positions: {len(positions)}")
    y = 660
    for i, pos in enumerate(positions[:8]):
        symbol = pos.get("symbol", "") or pos.get("name", "")
        qty = pos.get("quantity", "")
        price = pos.get("currentPrice", pos.get("price", ""))
        c.drawString(72, y - i * 14, f"{symbol}: {qty} @ {price}")

    transactions = portfolio.get("transactions", []) or []
    base_y = y - len(positions[:8]) * 14 - 20
    c.drawString(72, base_y, f"Recent Transactions: {len(transactions)}")
    c.save()

def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python generator.py <portfolio_json_path> <output_pdf_path>")
        sys.exit(2)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    portfolio = {}
    try:
        with input_path.open("r", encoding="utf-8") as f:
            portfolio = json.load(f)
    except Exception as e:
        print(f"Failed to read portfolio JSON: {e}")
        portfolio = {}

    generate_pdf(portfolio, output_path)

if __name__ == "__main__":
    main()
