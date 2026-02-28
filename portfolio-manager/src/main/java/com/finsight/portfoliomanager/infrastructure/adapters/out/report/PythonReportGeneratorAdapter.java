package com.finsight.portfoliomanager.infrastructure.adapters.out.report;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.application.ports.out.ProcessExecutor;
import com.finsight.portfoliomanager.application.ports.out.ReportGeneratorPort;
import com.finsight.portfoliomanager.domain.Portfolio;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class PythonReportGeneratorAdapter implements ReportGeneratorPort {
    private ObjectMapper objectMapper;
    private final Path scriptPath = Paths.get("report-service", "generator.py");
    private ProcessExecutor processExecutor;

    public PythonReportGeneratorAdapter(ObjectMapper objectMapper, ProcessExecutor processExecutor) {
        this.objectMapper = objectMapper;
        this.processExecutor = processExecutor;
    }

    @Override
    public Path generateReport(Portfolio portfolio, Path pdfPath) throws IOException {
        Path tempJson = Files.createTempFile("portfolio_", ".json");
        objectMapper.writeValue(tempJson.toFile(), portfolio);

        List<String> command = List.of(
                "python",
                scriptPath.toAbsolutePath().toString(),
                tempJson.toAbsolutePath().toString(),
                pdfPath.toAbsolutePath().toString()
        );

        try {
            int exitCode = processExecutor.execute(command);
            if (exitCode != 0) {
                throw new IOException("Report generator exited with code " + exitCode);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Report generator interrupted", e);
        }

        if (!Files.exists(pdfPath)) {
            throw new IOException("PDF was not created by report generator");
        }
        return pdfPath;
    }
}
