package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
public class DataCollectorClientImpl implements DataCollectorClient {

    private final RestClient dataCollectorClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String MOVERS_CACHE_KEY = "assetMovers:";
    private static final long MOVERS_CACHE_TTL_SECONDS = 60;

    @Autowired
    public DataCollectorClientImpl(@Qualifier("dataCollectorClient") RestClient dataCollectorClient,
                                    RedisTemplate<String, Object> redisTemplate) {
        this.dataCollectorClient = dataCollectorClient;
        this.redisTemplate = redisTemplate;
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
                            r.open(),
                            r.high(),
                            r.low(),
                            r.close(),
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
        Float open,
        Float high,
        Float low,
        Float close,
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
    public AssetMoversDTO getAssetMovers(String category, String sort, int limit) {
        String cacheKey = MOVERS_CACHE_KEY + category + ":" + sort + ":" + limit;
        
        // Try cache first
        try {
            @SuppressWarnings("unchecked")
            AssetMoversDTO cached = (AssetMoversDTO) redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                System.out.println("CACHE HIT: " + cacheKey);
                return cached;
            }
            System.out.println("CACHE MISS: " + cacheKey);
        } catch (Exception e) {
            System.out.println("CACHE ERROR (read): " + e.getMessage());
        }
        
        try {
            // Data collector now returns structured response: {gainers: [], losers: [], most_active: [], updated_at: "..."}
            Map<String, Object> response = dataCollectorClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/assets/movers")
                            .queryParam("category", category)
                            .queryParam("sort", sort)
                            .queryParam("limit", limit)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            
            if (response == null || response.isEmpty()) {
                return new AssetMoversDTO(List.of(), List.of(), List.of());
            }
            
            // Extract the three lists from the structured response
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> gainersRaw = (List<Map<String, Object>>) response.get("gainers");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> losersRaw = (List<Map<String, Object>>) response.get("losers");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> mostActiveRaw = (List<Map<String, Object>>) response.get("most_active");
            
            // Convert raw maps to AssetMoverDTO
            List<AssetMoverDTO> gainers = convertToAssetMoverDTO(gainersRaw);
            List<AssetMoverDTO> losers = convertToAssetMoverDTO(losersRaw);
            List<AssetMoverDTO> traded = convertToAssetMoverDTO(mostActiveRaw);
            
            // If sort is "volatile" or "gain"/"loss", use the appropriate list
            // The data collector already returns them pre-sorted by FMP
            List<AssetMoverDTO> resultGainers, resultLosers, resultTraded;
            
            if ("gain".equals(sort) || "gainers".equals(sort)) {
                resultGainers = gainers;
                resultLosers = losers;
                resultTraded = traded;
            } else if ("loss".equals(sort) || "losers".equals(sort)) {
                resultGainers = gainers;
                resultLosers = losers;
                resultTraded = traded;
            } else if ("volume".equals(sort) || "most_active".equals(sort)) {
                resultGainers = gainers;
                resultLosers = losers;
                resultTraded = traded;
            } else {
                // "volatile" - use most_active as the primary, but include all
                resultGainers = gainers;
                resultLosers = losers;
                resultTraded = traded;
            }
            
            // Limit each list
            if (resultGainers.size() > limit) resultGainers = resultGainers.subList(0, limit);
            if (resultLosers.size() > limit) resultLosers = resultLosers.subList(0, limit);
            if (resultTraded.size() > limit) resultTraded = resultTraded.subList(0, limit);
            
            AssetMoversDTO result = new AssetMoversDTO(resultGainers, resultLosers, resultTraded);
            
            // Cache the result
            try {
                redisTemplate.opsForValue().set(cacheKey, result, MOVERS_CACHE_TTL_SECONDS, TimeUnit.SECONDS);
                System.out.println("CACHE WRITE: " + cacheKey);
            } catch (Exception e) {
                System.out.println("CACHE ERROR (write): " + e.getMessage());
            }
            
            return result;
        } catch (Exception e) {
            System.out.println("DATA COLLECTOR ERROR: " + e.getMessage());
            e.printStackTrace();
            return new AssetMoversDTO(List.of(), List.of(), List.of());
        }
    }
    
    private List<AssetMoverDTO> convertToAssetMoverDTO(List<Map<String, Object>> rawList) {
        if (rawList == null) return List.of();
        return rawList.stream()
                .map(map -> new AssetMoverDTO(
                        (String) map.get("symbol"),
                        (String) map.get("name"),
                        map.get("price") != null ? ((Number) map.get("price")).floatValue() : 0f,
                        map.get("changePercent") != null ? ((Number) map.get("changePercent")).floatValue() : 0f,
                        map.get("changeValue") != null ? ((Number) map.get("changeValue")).floatValue() : 0f,
                        map.get("volume") != null ? ((Number) map.get("volume")).floatValue() : 0f,
                        map.get("changePercent24h") != null ? ((Number) map.get("changePercent24h")).floatValue() : 0f,
                        map.get("volume24h") != null ? ((Number) map.get("volume24h")).floatValue() : 0f,
                        map.get("volatility") != null ? ((Number) map.get("volatility")).floatValue() : 0f
                ))
                .collect(Collectors.toList());
    }
}