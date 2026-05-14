package com.finsight.portfoliomanager.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import com.finsight.proto.Asset;
import com.finsight.proto.PricePoint;

class AssetSearchServiceMoversTest {

    @Test
    void getAssetMovers_sortsByAbsoluteVolatility() {
        GrpcFinancialDataClient grpc = mock(GrpcFinancialDataClient.class);
        AssetSearchService service = new AssetSearchService(grpc);

        when(grpc.getCategorizedAssets()).thenReturn(List.of(
                asset("BTC-USD", "Bitcoin", "CRYPTO"),
                asset("AAPL", "Apple", "STOCKS"),
                asset("TSLA", "Tesla", "STOCKS")));

        when(grpc.getPriceHistory("BTC-USD", 5)).thenReturn(history(100, 115));
        when(grpc.getPriceHistory("AAPL", 5)).thenReturn(history(100, 103));
        when(grpc.getPriceHistory("TSLA", 5)).thenReturn(history(100, 92));

        List<AssetSearchService.AssetMover> movers = service.getAssetMovers("volatile", 3);

        assertEquals(3, movers.size());
        assertEquals("BTC-USD", movers.get(0).getSymbol());
        assertEquals("TSLA", movers.get(1).getSymbol());
        assertEquals("AAPL", movers.get(2).getSymbol());
    }

    @Test
    void getAssetMovers_sortsLossesAscending() {
        GrpcFinancialDataClient grpc = mock(GrpcFinancialDataClient.class);
        AssetSearchService service = new AssetSearchService(grpc);

        when(grpc.getCategorizedAssets()).thenReturn(List.of(
                asset("ETH-USD", "Ethereum", "CRYPTO"),
                asset("TSLA", "Tesla", "STOCKS"),
                asset("MSFT", "Microsoft", "STOCKS")));

        when(grpc.getPriceHistory("ETH-USD", 5)).thenReturn(history(100, 95));
        when(grpc.getPriceHistory("TSLA", 5)).thenReturn(history(100, 90));
        when(grpc.getPriceHistory("MSFT", 5)).thenReturn(history(100, 98));

        List<AssetSearchService.AssetMover> movers = service.getAssetMovers("loss", 2);

        assertEquals(2, movers.size());
        assertEquals("TSLA", movers.get(0).getSymbol());
        assertEquals("ETH-USD", movers.get(1).getSymbol());
    }

    @Test
    void getAssetMovers_ignoresAssetsWithoutEnoughHistory() {
        GrpcFinancialDataClient grpc = mock(GrpcFinancialDataClient.class);
        AssetSearchService service = new AssetSearchService(grpc);

        when(grpc.getCategorizedAssets()).thenReturn(List.of(
                asset("BTC-USD", "Bitcoin", "CRYPTO"),
                asset("AAPL", "Apple", "STOCKS")));

        when(grpc.getPriceHistory("BTC-USD", 5)).thenReturn(history(100, 101));
        when(grpc.getPriceHistory("AAPL", 5)).thenReturn(List.of(point(200)));

        List<AssetSearchService.AssetMover> movers = service.getAssetMovers("volatile", 8);

        assertEquals(1, movers.size());
        assertEquals("BTC-USD", movers.get(0).getSymbol());
        assertTrue(movers.get(0).getChangePercent() > 0);
    }

    private static Asset asset(String symbol, String name, String category) {
        return Asset.newBuilder().setSymbol(symbol).setName(name).setCategory(category).build();
    }

    private static List<PricePoint> history(double previous, double latest) {
        return List.of(point(previous), point(latest));
    }

    private static PricePoint point(double price) {
        return PricePoint.newBuilder().setPrice(price).setDate("2026-05-12").build();
    }
}
