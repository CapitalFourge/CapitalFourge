package com.finsight.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.stereotype.Component;

import com.finsight.portfoliomanager.application.ports.out.MetricRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RedisMetricAdapter implements MetricRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String ASSET_TRENDS_KEY = "metrics:assets:trends";
    private static final String USER_ACTIVITY_KEY = "metrics:users:active";
    private static final String PORTFOLIO_COUNT_KEY = "metrics:portfolios:total";
    private static final String LEADERBOARD_KEY = "metrics:portfolios:leaderboard";

    @Override
    public void incrementAssetVolume(String symbol, double volume) {
        redisTemplate.opsForZSet().incrementScore(ASSET_TRENDS_KEY, symbol, volume);
    }

    @Override
    public Double getAssetVolume(String symbol) {
        Double score = redisTemplate.opsForZSet().score(ASSET_TRENDS_KEY, symbol);
        return score != null ? score : 0.0;
    }

    @Override
    public Map<String, Double> getTrendingAssets(int topN) {
        Set<TypedTuple<String>> results = redisTemplate.opsForZSet()
                .reverseRangeWithScores(ASSET_TRENDS_KEY, 0, topN - 1);

        Map<String, Double> trends = new HashMap<>();
        if (results != null) {
            for (TypedTuple<String> tuple : results) {
                trends.put(tuple.getValue(), tuple.getScore());
            }
        }
        return trends;
    }

    @Override
    public void recordUserActivity(String userId) {
        redisTemplate.opsForSet().add(USER_ACTIVITY_KEY, userId);
    }

    @Override
    public Long getTotalUsers() {
        return redisTemplate.opsForSet().size(USER_ACTIVITY_KEY);
    }

    @Override
    public void incrementPortfolioCount() {
        redisTemplate.opsForValue().increment(PORTFOLIO_COUNT_KEY);
    }

    @Override
    public Long getTotalPortfolios() {
        String val = redisTemplate.opsForValue().get(PORTFOLIO_COUNT_KEY);
        return val == null ? 0L : Long.parseLong(val);
    }

    @Override
    public void updatePortfolioPerformance(String portfolioId, double profit) {
        redisTemplate.opsForZSet().add(LEADERBOARD_KEY, portfolioId, profit);
    }

    @Override
    public Map<String, Double> getTopPortfolios(int topN) {
        Set<TypedTuple<String>> results = redisTemplate.opsForZSet()
                .reverseRangeWithScores(LEADERBOARD_KEY, 0, topN - 1);
        Map<String, Double> leaderboard = new HashMap<>();
        if (results != null) {
            for (TypedTuple<String> tuple : results) {
                leaderboard.put(tuple.getValue(), tuple.getScore());
            }
        }
        return leaderboard;
    }
}
