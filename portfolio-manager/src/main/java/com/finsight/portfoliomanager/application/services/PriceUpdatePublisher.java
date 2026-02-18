package com.finsight.portfoliomanager.application.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceUpdatePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishPriceUpdate(String symbol, BigDecimal price) {
        PriceUpdate update = PriceUpdate.builder()
                .symbol(symbol)
                .price(price)
                .timestamp(LocalDateTime.now().toString())
                .build();
        messagingTemplate.convertAndSend("/topic/price-updates", update);
        log.debug("Published price update for symbol: {} at price: {}", symbol, price);
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PriceUpdate {

        private String symbol;
        private BigDecimal price;
        private String timestamp;
    }
}
