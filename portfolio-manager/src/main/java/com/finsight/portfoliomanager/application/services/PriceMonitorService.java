package com.finsight.portfoliomanager.application.services;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;

import com.finsight.portfoliomanager.application.ports.out.OrderRepository;
import com.finsight.portfoliomanager.domain.Order;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PriceMonitorService implements MessageListener {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public PriceMonitorService(OrderRepository orderRepository, OrderService orderService, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String json = new String(message.getBody());
            PriceUpdate priceUpdate = objectMapper.readValue(json, PriceUpdate.class);

            log.debug("Received price update for symbol: {} at price: {}",
                    priceUpdate.getSymbol(), priceUpdate.getPrice());

            checkAndExecuteOrders(priceUpdate.getSymbol(), priceUpdate.getPrice());
        } catch (Exception e) {
            log.error("Error processing price update: {}", e.getMessage());
        }
    }

    public void checkAndExecuteOrders(String symbol, BigDecimal price) {
        try {
            List<Order> pendingOrders = orderRepository.findPendingOrdersBySymbol(symbol);

            if (pendingOrders.isEmpty()) {
                return;
            }

            log.info("Checking {} pending orders for symbol: {}", pendingOrders.size(), symbol);

            for (Order order : pendingOrders) {
                if (shouldExecute(order, price)) {
                    log.info("Executing order {} for symbol {} at price {}",
                            order.getId(), symbol, price);
                    orderService.executeOrder(order.getId(), price);
                }
            }
        } catch (Exception e) {
            log.error("Error checking orders for symbol {}: {}", symbol, e.getMessage());
        }
    }

    private boolean shouldExecute(Order order, BigDecimal currentPrice) {
        // Check if order is expired
        if (java.time.LocalDateTime.now().isAfter(order.getExpiresAt())) {
            log.debug("Order {} is expired", order.getId());
            return false;
        }

        // Check if price condition is met
        // For BUY_LIMIT: currentPrice <= targetPrice
        // For SELL_LIMIT: currentPrice >= targetPrice
        if (order.getType() == com.finsight.portfoliomanager.domain.OrderType.BUY_LIMIT) {
            return currentPrice.compareTo(order.getTargetPrice()) <= 0;
        } else {
            return currentPrice.compareTo(order.getTargetPrice()) >= 0;
        }
    }

    public static class PriceUpdate {

        private String symbol;
        private BigDecimal price;
        private String timestamp;

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
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
