package com.capitalfourge.portfoliomanager.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.redis.testcontainers.RedisContainer;

import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-for-testing-only-minimum-256-bits-length-required",
    "jwt.issuer=capital-fourge-test",
    "jwt.access-expiration-ms=86400000",
    "jwt.refresh-expiration-ms=604800000",
    "spring.profiles.active=test",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthCookieIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Container
    static RedisContainer redis = new RedisContainer("redis:7-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
        registry.add("spring.redis.ssl.enabled", () -> "false");
    }

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PortfolioRepository portfolioRepository;

    private String baseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    void testFullAuthFlowWithHttpOnlyCookies() {
        // 1. Register user
        String email = "cookietest@example.com";
        String password = "TestPass123!";
        
        HttpHeaders registerHeaders = new HttpHeaders();
        registerHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        String registerBody = String.format("{\"username\":\"cookietest\",\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        ResponseEntity<String> registerResponse = restTemplate.exchange(
            baseUrl() + "/api/auth/register",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(registerBody, registerHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, registerResponse.getStatusCode(), "Register should succeed");

        // 2. Login and get cookies
        HttpHeaders loginHeaders = new HttpHeaders();
        loginHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        String loginBody = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        ResponseEntity<String> loginResponse = restTemplate.exchange(
            baseUrl() + "/api/auth/login",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(loginBody, loginHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login should succeed");

        // Extract cookies from login response
        List<String> cookies = loginResponse.getHeaders().get("Set-Cookie");
        assertNotNull(cookies, "Should have Set-Cookie headers");
        
        String accessTokenCookie = cookies.stream()
            .filter(c -> c.startsWith("access_token="))
            .findFirst()
            .orElse(null);
        String refreshTokenCookie = cookies.stream()
            .filter(c -> c.startsWith("refresh_token="))
            .findFirst()
            .orElse(null);
        
        assertNotNull(accessTokenCookie, "Should have access_token cookie");
        assertNotNull(refreshTokenCookie, "Should have refresh_token cookie");
        assertTrue(accessTokenCookie.contains("HttpOnly"), "access_token should be HttpOnly");
        assertTrue(accessTokenCookie.contains("Secure"), "access_token should be Secure");
        assertTrue(accessTokenCookie.contains("SameSite=Lax"), "access_token should have SameSite=Lax");
        assertTrue(refreshTokenCookie.contains("HttpOnly"), "refresh_token should be HttpOnly");
        assertTrue(refreshTokenCookie.contains("Secure"), "refresh_token should be Secure");

        // 3. Create test data (portfolio)
        User user = userRepository.findByEmail(email).orElseThrow();
        Portfolio portfolio = new Portfolio(
            UUID.randomUUID(),
            "Cookie Test Portfolio",
            "Test portfolio for cookie auth",
            user.getId(),
            List.of(), List.of(), List.of(),
            BigDecimal.ZERO, BigDecimal.ZERO,
            0.0, false, null
        );
        portfolioRepository.save(portfolio);
        String shareSlug = portfolio.getShareSlug();
        assertNotNull(shareSlug, "shareSlug should be auto-generated");

        // 4. Query GraphQL with cookies (should work for owner's private portfolio)
        String graphqlQuery = String.format(
            "{\"query\":\"query { portfolioBySlug(slug: \\\"%s\\\") { id name shareSlug isPublic } }\"}", 
            shareSlug
        );
        
        HttpHeaders graphqlHeaders = new HttpHeaders();
        graphqlHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        graphqlHeaders.set("Cookie", accessTokenCookie.split(";")[0] + "; " + refreshTokenCookie.split(";")[0]);
        
        ResponseEntity<String> graphqlResponse = restTemplate.exchange(
            baseUrl() + "/graphql",
            HttpMethod.POST,
            new HttpEntity<>(graphqlQuery, graphqlHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, graphqlResponse.getStatusCode());
        assertTrue(graphqlResponse.getBody().contains("\"name\":\"Cookie Test Portfolio\""), 
            "Should load private portfolio via cookie auth");
        assertTrue(graphqlResponse.getBody().contains("\"isPublic\":false"), 
            "Portfolio should be private");

        // 5. Test portfolios query with cookies
        String portfoliosQuery = "{\"query\":\"{ portfolios { id name shareSlug isPublic } }\"}";
        ResponseEntity<String> portfoliosResponse = restTemplate.exchange(
            baseUrl() + "/graphql",
            HttpMethod.POST,
            new HttpEntity<>(portfoliosQuery, graphqlHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, portfoliosResponse.getStatusCode());
        assertTrue(portfoliosResponse.getBody().contains("Cookie Test Portfolio"), 
            "Should list user's portfolios via cookie auth");

        // 6. Test refresh token rotation (new cookies)
        HttpHeaders refreshHeaders = new HttpHeaders();
        refreshHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        refreshHeaders.set("Cookie", accessTokenCookie.split(";")[0] + "; " + refreshTokenCookie.split(";")[0]);
        
        ResponseEntity<String> refreshResponse = restTemplate.exchange(
            baseUrl() + "/api/auth/refresh",
            HttpMethod.POST,
            new HttpEntity<>("{}", refreshHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, refreshResponse.getStatusCode());
        
        List<String> newCookies = refreshResponse.getHeaders().get("Set-Cookie");
        assertNotNull(newCookies, "Refresh should set new cookies");
        
        String newAccessToken = newCookies.stream()
            .filter(c -> c.startsWith("access_token="))
            .findFirst()
            .orElse(null);
        String newRefreshToken = newCookies.stream()
            .filter(c -> c.startsWith("refresh_token="))
            .findFirst()
            .orElse(null);
        
        assertNotNull(newAccessToken, "Should get new access_token");
        assertNotNull(newRefreshToken, "Should get new refresh_token");
        assertTrue(!newAccessToken.equals(accessTokenCookie.split(";")[0]), "Access token should rotate");
        assertTrue(!newRefreshToken.equals(refreshTokenCookie.split(";")[0]), "Refresh token should rotate");

        // 7. Test new cookies work for GraphQL
        HttpHeaders newGraphqlHeaders = new HttpHeaders();
        newGraphqlHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        newGraphqlHeaders.set("Cookie", newAccessToken + "; " + newRefreshToken);
        
        ResponseEntity<String> newGraphqlResponse = restTemplate.exchange(
            baseUrl() + "/graphql",
            HttpMethod.POST,
            new HttpEntity<>(graphqlQuery, newGraphqlHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, newGraphqlResponse.getStatusCode());
        assertTrue(newGraphqlResponse.getBody().contains("\"name\":\"Cookie Test Portfolio\""), 
            "New cookies should work for GraphQL");

        // 8. Test logout clears cookies
        HttpHeaders logoutHeaders = new HttpHeaders();
        logoutHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        logoutHeaders.set("Cookie", newAccessToken + "; " + newRefreshToken);
        
        ResponseEntity<String> logoutResponse = restTemplate.exchange(
            baseUrl() + "/api/auth/logout/" + user.getId(),
            HttpMethod.POST,
            new HttpEntity<>("{}", logoutHeaders),
            String.class
        );
        assertEquals(HttpStatus.OK, logoutResponse.getStatusCode());
        
        List<String> logoutCookies = logoutResponse.getHeaders().get("Set-Cookie");
        assertNotNull(logoutCookies, "Logout should clear cookies");
        
        String clearedAccess = logoutCookies.stream()
            .filter(c -> c.startsWith("access_token="))
            .findFirst()
            .orElse(null);
        String clearedRefresh = logoutCookies.stream()
            .filter(c -> c.startsWith("refresh_token="))
            .findFirst()
            .orElse(null);
        
        assertNotNull(clearedAccess, "Should clear access_token");
        assertNotNull(clearedRefresh, "Should clear refresh_token");
        assertTrue(clearedAccess.contains("Max-Age=0"), "access_token should be cleared (Max-Age=0)");
        assertTrue(clearedRefresh.contains("Max-Age=0"), "refresh_token should be cleared (Max-Age=0)");

        // 9. Test sharedPortfolio (public only)
        // Make portfolio public first
        Portfolio publicPortfolio = portfolioRepository.findById(portfolio.getId()).orElseThrow();
        publicPortfolio.setIsPublic(true);
        portfolioRepository.save(publicPortfolio);
        
        String sharedQuery = String.format(
            "{\"query\":\"query { sharedPortfolio(slug: \\\"%s\\\") { id name isPublic } }\"}", 
            shareSlug
        );
        
        ResponseEntity<String> sharedResponse = restTemplate.exchange(
            baseUrl() + "/graphql",
            HttpMethod.POST,
            new HttpEntity<>(sharedQuery, new HttpHeaders()),
            String.class
        );
        assertEquals(HttpStatus.OK, sharedResponse.getStatusCode());
        assertTrue(sharedResponse.getBody().contains("\"isPublic\":true"), 
            "sharedPortfolio should return public portfolio without auth");

        // 10. Test sharedPortfolio returns null for private
        Portfolio privatePortfolio = new Portfolio(
            UUID.randomUUID(),
            "Private Portfolio",
            "Private test",
            user.getId(),
            List.of(), List.of(), List.of(),
            BigDecimal.ZERO, BigDecimal.ZERO,
            0.0, false, null
        );
        portfolioRepository.save(privatePortfolio);
        String privateSlug = privatePortfolio.getShareSlug();
        
        String sharedPrivateQuery = String.format(
            "{\"query\":\"query { sharedPortfolio(slug: \\\"%s\\\") { id name } }\"}", 
            privateSlug
        );
        
        ResponseEntity<String> sharedPrivateResponse = restTemplate.exchange(
            baseUrl() + "/graphql",
            HttpMethod.POST,
            new HttpEntity<>(sharedPrivateQuery, new HttpHeaders()),
            String.class
        );
        assertEquals(HttpStatus.OK, sharedPrivateResponse.getStatusCode());
        assertTrue(sharedPrivateResponse.getBody().contains("\"sharedPortfolio\":null"), 
            "sharedPortfolio should return null for private portfolio");
    }
}