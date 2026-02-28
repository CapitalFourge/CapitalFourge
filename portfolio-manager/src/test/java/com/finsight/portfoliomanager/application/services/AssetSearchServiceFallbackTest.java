package com.finsight.portfoliomanager.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

/** Tests for AssetSearchService fallback behavior when gRPC is unavailable */
public class AssetSearchServiceFallbackTest {

    @Test
    void returnsFallbackAssetsWhenGrpcFails() {
        GrpcFinancialDataClient mockGrpc = mock(GrpcFinancialDataClient.class);
        // Simulate failure
        when(mockGrpc.getCategorizedAssets()).thenThrow(new RuntimeException("simulated-failure"));

        AssetSearchService service = new AssetSearchService(mockGrpc);
        List<AssetSearchService.AssetInfo> assets = service.getCategorizedAssets(null);

        // Expect the three fallback assets BTC, ETH, AAPL
        assertEquals(3, assets.size());
        boolean hasBTC = assets.stream().anyMatch(a -> "BTC".equals(a.getSymbol()));
        assertTrue(hasBTC);
    }
}
