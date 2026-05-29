package com.finsight.portfoliomanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.test.context.ActiveProfiles;

// Disable embedded Redis auto-start for unit tests
@SpringBootTest(properties = {
    "spring.data.redis.enabled=false",
    "spring.redis.enabled=false"
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
