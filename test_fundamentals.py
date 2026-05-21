import grpc
from financial_data_pb2 import HistoryRequest
from financial_data_pb2_grpc import FinancialDataServiceStub
import sys

try:
    channel = grpc.insecure_channel('localhost:50051')
    stub = FinancialDataServiceStub(channel)
    
    # Solicitar historial para AAPL (por defecto 1 día)
    request = HistoryRequest(symbol='AAPL', days=1)
    response = stub.GetPriceHistory(request)
    
    print(f'Received {len(response.history)} data points for {response.symbol}')
    if response.history:
        latest = response.history[-1]
        print('Latest data point:')
        print(f'  Date: {latest.date}')
        print(f'  Close: {latest.close}')
        print(f'  Market Cap: {latest.market_cap}')
        print(f'  Trailing PE: {latest.trailing_pe}')
        print(f'  Forward PE: {latest.forward_pe}')
        print(f'  PEG Ratio: {latest.peg_ratio}')
        print(f'  Price to Book: {latest.price_to_book}')
        print(f'  Profit Margins: {latest.profit_margins}')
        print(f'  Return on Equity: {latest.return_on_equity}')
        print(f'  Debt to Equity: {latest.debt_to_equity}')
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()