package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.ReportGeneratorPort;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/reports")
// Manual constructor to avoid Lombok dependency issues in test env
public class ReportController {
    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final PortfolioUseCase portfolioUseCase;
    private final ObjectMapper objectMapper;
    private final ReportGeneratorPort reportGeneratorPort;

    // Explicit constructor (avoids relying on Lombok at compile-time)
    public ReportController(PortfolioUseCase portfolioUseCase, ObjectMapper objectMapper, ReportGeneratorPort reportGeneratorPort) {
        this.portfolioUseCase = portfolioUseCase;
        this.objectMapper = objectMapper;
        this.reportGeneratorPort = reportGeneratorPort;
    }

    @GetMapping("/portfolio/{id}")
    public ResponseEntity<InputStreamResource> generateReport(@PathVariable UUID id) throws IOException {
        log.info("📊 Generating PDF report for portfolio: {}", id);
        Portfolio portfolio = portfolioUseCase.getPortfolio(id);

        Path pdfPath = Files.createTempFile("report_" + id, ".pdf");
        Path generated = reportGeneratorPort.generateReport(portfolio, pdfPath);
        File file = generated.toFile();
        InputStreamResource resource = new InputStreamResource(new FileInputStream(file));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment;filename=report_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(file.length())
                .body(resource);
    }
}
