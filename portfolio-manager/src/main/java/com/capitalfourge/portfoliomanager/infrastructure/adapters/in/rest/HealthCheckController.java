package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
