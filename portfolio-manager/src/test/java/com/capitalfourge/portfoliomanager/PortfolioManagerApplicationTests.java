package com.capitalfourge.portfoliomanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.session.SessionAutoConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.test.context.ActiveProfiles;

// Disable embedded Redis auto-start for unit tests
@SpringBootTest(properties = {
    "spring.data.redis.enabled=false",
    "spring.redis.enabled=false",
    "spring.redis.url=",
    "spring.jwt.secret=test-secret-key-for-testing-only-minimum-256-bits-length-required",
    "spring.jwt.issuer=capital-fourge-test",
    "spring.jwt.access-expiration-ms=86400000",
    "spring.jwt.refresh-expiration-ms=604800000"
})
@EnableAutoConfiguration(exclude = {
    RedisAutoConfiguration.class,
    RedisRepositoriesAutoConfiguration.class,
    SessionAutoConfiguration.class
})
@ActiveProfiles("test")
class PortfolioManagerApplicationTests {

    @MockBean
    private RedisTemplate<String, String> redisTemplate;

    @MockBean
    private RedisMessageListenerContainer redisMessageListenerContainer;

    @Test
    void contextLoads() {
    }

}