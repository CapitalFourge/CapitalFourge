package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricRepository metricRepository;

    @GetMapping("/trending")
    public Map<String, Double> getTrending(@RequestParam(defaultValue = "5") int top) {
        return metricRepository.getTrendingAssets(top);
    }

    @GetMapping("/leaderboard")
    public Map<String, Double> getLeaderboard(@RequestParam(defaultValue = "10") int top) {
        return metricRepository.getTopPortfolios(top);
    }

    @GetMapping("/admin/stats")
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsersUnique", metricRepository.getTotalUsers());
        stats.put("totalPortfoliosCreated", metricRepository.getTotalPortfolios());
        stats.put("topProfitPortfolios", metricRepository.getTopPortfolios(10));
        return stats;
    }
}