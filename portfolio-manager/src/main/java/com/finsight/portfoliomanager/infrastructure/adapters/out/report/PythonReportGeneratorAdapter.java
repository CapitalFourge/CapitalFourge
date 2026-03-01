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
    private final ObjectMapper objectMapper;
    private final ProcessExecutor processExecutor;

    public PythonReportGeneratorAdapter(ObjectMapper objectMapper, ProcessExecutor processExecutor) {
        this.objectMapper = objectMapper;
        this.processExecutor = processExecutor;
    }

    private Path findScriptPath() throws IOException {
        // Try relative to current working directory
        Path path = Paths.get("report-service", "generator.py");
        if (Files.exists(path)) {
            return path.toAbsolutePath();
        }

        // Try in the parent directory (case where we might be running from within a
        // submodule directory)
        Path parentPath = Paths.get("..", "report-service", "generator.py");
        if (Files.exists(parentPath)) {
            return parentPath.toAbsolutePath();
        }

        // Try absolute path if we can determine repo root (hacky but useful for
        // debugging)
        String repoRoot = System.getProperty("user.dir");
        if (repoRoot != null) {
            Path rootPath = Paths.get(repoRoot, "report-service", "generator.py");
            if (Files.exists(rootPath)) {
                return rootPath.toAbsolutePath();
            }
        }

        throw new IOException("Report generator script not found. Looked in: " +
                path.toAbsolutePath() + ", " + parentPath.toAbsolutePath());
    }

    @Override
    public Path generateReport(Portfolio portfolio, Path pdfPath) throws IOException {
        Path tempJson = Files.createTempFile("portfolio_", ".json");
        try {
            objectMapper.writeValue(tempJson.toFile(), portfolio);

            Path resolvedScriptPath = findScriptPath();

            List<String> command = List.of(
                    "python",
                    resolvedScriptPath.toString(),
                    tempJson.toAbsolutePath().toString(),
                    pdfPath.toAbsolutePath().toString());

            try {
                ProcessExecutor.ExecutionResult result = processExecutor.executeWithOutput(command);
                if (result.exitCode != 0) {
                    throw new IOException(
                            "Report generator failed (code " + result.exitCode + "). Output: " + result.output);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Report generator interrupted", e);
            }

            if (!Files.exists(pdfPath)) {
                throw new IOException("PDF was not created by report generator");
            }
            return pdfPath;
        } finally {
            Files.deleteIfExists(tempJson);
        }
    }
}
