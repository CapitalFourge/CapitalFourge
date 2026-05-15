package com.finsight.portfoliomanager.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import com.finsight.proto.PricePoint;

class TechnicalAnalysisServiceTest {

    @Test
    void getIndicators_returnsExpectedSeries() {
        GrpcFinancialDataClient grpc = mock(GrpcFinancialDataClient.class);
        TechnicalAnalysisService service = new TechnicalAnalysisService(grpc);

        when(grpc.getPriceHistory("AAPL", 365)).thenReturn(buildHistory(60, 100, 1.25));

        List<TechnicalAnalysisService.IndicatorSeries> indicators = service.getIndicators("AAPL", 365);

        assertEquals(9, indicators.size());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("sma")).findFirst().orElseThrow().getPoints().isEmpty());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("ema")).findFirst().orElseThrow().getPoints().isEmpty());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("wma")).findFirst().orElseThrow().getPoints().isEmpty());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("rsi")).findFirst().orElseThrow().getPoints().isEmpty());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("roc")).findFirst().orElseThrow().getPoints().isEmpty());
        assertFalse(indicators.stream().filter(series -> series.getId().equals("obv")).findFirst().orElseThrow().getPoints().isEmpty());
    }

    @Test
    void getIndicators_populatesStructuredIndicatorFields() {
        GrpcFinancialDataClient grpc = mock(GrpcFinancialDataClient.class);
        TechnicalAnalysisService service = new TechnicalAnalysisService(grpc);

        when(grpc.getPriceHistory("BTC-USD", 365)).thenReturn(buildHistory(80, 200, 2.5));

        List<TechnicalAnalysisService.IndicatorSeries> indicators = service.getIndicators("BTC-USD", 365);

        TechnicalAnalysisService.IndicatorSeries macd = indicators.stream()
                .filter(series -> series.getId().equals("macd"))
                .findFirst()
                .orElseThrow();
        TechnicalAnalysisService.IndicatorSeries bollinger = indicators.stream()
                .filter(series -> series.getId().equals("bollinger"))
                .findFirst()
                .orElseThrow();
        TechnicalAnalysisService.IndicatorSeries stochastic = indicators.stream()
                .filter(series -> series.getId().equals("stochastic"))
                .findFirst()
                .orElseThrow();

        assertFalse(macd.getPoints().isEmpty());
        assertNotNull(macd.getPoints().get(macd.getPoints().size() - 1).getValue());
        assertNotNull(macd.getPoints().get(macd.getPoints().size() - 1).getSignal());
        assertNotNull(macd.getPoints().get(macd.getPoints().size() - 1).getHistogram());

        assertFalse(bollinger.getPoints().isEmpty());
        assertNotNull(bollinger.getPoints().get(0).getUpper());
        assertNotNull(bollinger.getPoints().get(0).getMiddle());
        assertNotNull(bollinger.getPoints().get(0).getLower());

        assertFalse(stochastic.getPoints().isEmpty());
        assertNotNull(stochastic.getPoints().get(0).getK());
        assertNotNull(stochastic.getPoints().get(0).getD());
    }

    private static List<PricePoint> buildHistory(int length, double basePrice, double step) {
        return java.util.stream.IntStream.range(0, length)
                .mapToObj(index -> PricePoint.newBuilder()
                        .setDate("2026-01-" + String.format("%02d", (index % 28) + 1))
                        .setPrice(basePrice + (index * step) + ((index % 5) * 0.35))
                        .build())
                .toList();
    }
}
