package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.report;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.capitalfourge.portfoliomanager.application.ports.out.ProcessExecutor;
import com.capitalfourge.portfoliomanager.application.ports.out.ReportGeneratorPort;
import com.capitalfourge.portfoliomanager.domain.Portfolio;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PythonReportGeneratorAdapter implements ReportGeneratorPort {
    private final ObjectMapper objectMapper;
    private final ProcessExecutor processExecutor;

    // P2-12: Thread safety - lock for process execution
    private final ReentrantLock executionLock = new ReentrantLock();

    @Value("${report.generator.script-path:report-service/generator.py}")
    private String scriptPath;

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
                // P2-12: Acquire lock with timeout to prevent indefinite blocking
                if (!executionLock.tryLock(30, TimeUnit.SECONDS)) {
                    throw new IOException("Could not acquire lock for report generation within timeout");
                }
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
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Lock acquisition interrupted", e);
            } finally {
                executionLock.unlock();
            }

            if (!Files.exists(pdfPath)) {
                throw new IOException("PDF was not created by report generator");
            }
            return pdfPath;
        } finally {
            Files.deleteIfExists(tempJson);
        }
    }

    // P2-13: Resolve script path from configured property (not relative to CWD)
    private Path findScriptPath() throws IOException {
        Path path = Paths.get(scriptPath);
        if (Files.exists(path)) {
            return path.toAbsolutePath();
        }

        // Fallback: try relative to user.dir
        String repoRoot = System.getProperty("user.dir");
        if (repoRoot != null) {
            Path rootPath = Paths.get(repoRoot, scriptPath);
            if (Files.exists(rootPath)) {
                return rootPath.toAbsolutePath();
            }
        }

        throw new IOException("Report generator script not found at: " + scriptPath
                + " (also tried relative to " + System.getProperty("user.dir") + ")");
    }
}