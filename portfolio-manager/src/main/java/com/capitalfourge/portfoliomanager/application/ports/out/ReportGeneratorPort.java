package com.capitalfourge.portfoliomanager.application.ports.out;

import com.capitalfourge.portfoliomanager.domain.Portfolio;

import java.io.IOException;
import java.nio.file.Path;

public interface ReportGeneratorPort {
    Path generateReport(Portfolio portfolio, Path pdfPath) throws IOException;
}
