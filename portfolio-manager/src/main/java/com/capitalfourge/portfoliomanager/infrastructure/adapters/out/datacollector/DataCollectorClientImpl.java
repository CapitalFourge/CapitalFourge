package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class DataCollectorClientImpl implements DataCollectorClient {

    private final RestClient dataCollectorClient;

    @Autowired
    public DataCollectorClientImpl(@Qualifier("dataCollectorClient") RestClient dataCollectorClient) {
        this.dataCollectorClient = dataCollectorClient;
    }

    @Override
    public List<AssetDTO> getAssetsByCategory(String category) {
        try {
            return dataCollectorClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/assets/categorized")
                            .queryParam("category", category)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AssetDTO>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public List<AssetDTO> searchSymbols(String query, int limit) {
        try {
            return dataCollectorClient.post()
                    .uri("/assets/search")
                    .body(new SearchRequest(query, limit))
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AssetDTO>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public AssetDTO getAsset(String symbol) {
        try {
            AssetDTO dto = dataCollectorClient.get()
                    .uri("/asset/name/" + symbol)
                    .retrieve()
                    .body(AssetDTO.class);
            return dto;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public List<PricePointDTO> getPriceHistory(String symbol, String range) {
        try {
            int days = parseRangeToDays(range);
            List<RawPricePointDTO> raw = dataCollectorClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/price/history/" + symbol)
                            .queryParam("days", days)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<RawPricePointDTO>>() {});
            
            if (raw == null) return List.of();
            
            return raw.stream()
                    .map(r -> new PricePointDTO(
                            r.timestamp(),
                            r.price(),      // open
                            r.price(),      // high
                            r.price(),      // low
                            r.price(),      // close (use price as close)
                            r.volume() != null ? r.volume() : 0f,
                            r.timestamp(),  // date = timestamp
                            r.market_cap(),
                            r.trailing_pe(),
                            r.forward_pe(),
                            r.peg_ratio(),
                            r.price_to_book(),
                            r.price_to_sales(),
                            r.enterprise_to_ebitda(),
                            r.profit_margins(),
                            r.operating_margins(),
                            r.return_on_equity(),
                            r.return_on_assets(),
                            r.debt_to_equity(),
                            r.current_ratio(),
                            r.quick_ratio(),
                            r.dividend_yield(),
                            r.free_cash_flow(),
                            0f,  // circulatingSupply
                            0f,  // totalSupply
                            0f,  // maxSupply
                            0f,  // inflationRate
                            0f,  // fdv
                            0f,  // activeAddresses
                            0f,  // transactionVolume
                            0f,  // transactionCount
                            0f,  // feesGenerated
                            0f,  // tvl
                            0f,  // hashRate
                            0f,  // stakingRatio
                            0f,  // nakamotoCoefficient
                            0f,  // orderBookDepth
                            0f,  // developerActivity
                            0f,  // userGrowth
                            0f,  // revenue
                            0f,  // priceToFeesRatio
                            0f,  // bitcoinDominance
                            0f,  // fearGreedIndex
                            0f,  // inventoryLevels
                            0f,  // costOfProduction
                            0f,  // allInSustainingCost
                            0f,  // reserveReplacementRatio
                            0f,  // contangoBackwardation
                            0f,  // dollarIndexExposure
                            0f,  // inflationCorrelation
                            0f,  // opecSpareCapacity
                            0f,  // chineseDemandIndex
                            0f   // weatherIndex
                    ))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private int parseRangeToDays(String range) {
        if (range == null) return 30;
        return switch (range.toLowerCase()) {
            case "1d", "1day" -> 1;
            case "1w", "1week" -> 7;
            case "1m", "1month" -> 30;
            case "3m", "3month" -> 90;
            case "1y", "1year" -> 365;
            case "all" -> 3650;
            default -> 30;
        };
    }

    private record SearchRequest(String query, int limit) {}
    
    // Raw DTO matching the data collector's response
    private record RawPricePointDTO(
        String timestamp,
        Float price,
        Float volume,
        Float market_cap,
        Float trailing_pe,
        Float forward_pe,
        Float peg_ratio,
        Float price_to_book,
        Float price_to_sales,
        Float enterprise_to_ebitda,
        Float profit_margins,
        Float operating_margins,
        Float return_on_equity,
        Float return_on_assets,
        Float debt_to_equity,
        Float current_ratio,
        Float quick_ratio,
        Float dividend_yield,
        Float free_cash_flow
    ) {}

    @Override
    public List<AssetMoverDTO> getAssetMovers(String category, String sort, int limit) {
        try {
            return dataCollectorClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/assets/movers")
                            .queryParam("category", category)
                            .queryParam("sort", sort)
                            .queryParam("limit", limit)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AssetMoverDTO>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}