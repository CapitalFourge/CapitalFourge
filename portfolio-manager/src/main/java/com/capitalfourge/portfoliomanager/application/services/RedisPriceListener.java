package com.capitalfourge.portfoliomanager.application.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisPriceListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public void handlePriceUpdate(String message) {
        try {
            // Parse the message to extract symbol
            PriceUpdate priceUpdate = objectMapper.readValue(message, PriceUpdate.class);
            String symbol = priceUpdate.getSymbol();

            // Publish to symbol-specific topic
            messagingTemplate.convertAndSend("/topic/prices/" + symbol, message);
            log.debug("Published price update for symbol: {} to /topic/prices/{}", symbol, symbol);
        } catch (Exception e) {
            log.error("Error handling price update: {}", e.getMessage());
        }
    }

    public static class PriceUpdate {

        private String symbol;
        private Double price;
        private String timestamp;

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public Double getPrice() {
            return price;
        }

        public void setPrice(Double price) {
            this.price = price;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}
