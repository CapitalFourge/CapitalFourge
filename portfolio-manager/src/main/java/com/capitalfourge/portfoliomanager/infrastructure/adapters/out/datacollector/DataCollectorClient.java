package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector;

import java.util.List;

public interface DataCollectorClient {
    
    List<AssetDTO> getAssetsByCategory(String category);
    
    List<AssetDTO> searchSymbols(String query, int limit);
    
    record AssetDTO(String symbol, String name, String category) {}
}