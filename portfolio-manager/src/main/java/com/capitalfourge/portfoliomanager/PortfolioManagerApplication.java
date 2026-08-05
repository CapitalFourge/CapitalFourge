package com.capitalfourge.portfoliomanager;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class PortfolioManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioManagerApplication.class, args);
    }

    @Bean
    CommandLineRunner fixNullVersions(JdbcTemplate jdbcTemplate) {
        return args -> {
            int updated = jdbcTemplate.update("UPDATE users SET version = 0 WHERE version IS NULL");
            if (updated > 0) {
                System.out.println("Fixed " + updated + " users with NULL version");
            }
        };
    }
}