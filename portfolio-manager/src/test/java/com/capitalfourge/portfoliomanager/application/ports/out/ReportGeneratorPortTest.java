package com.capitalfourge.portfoliomanager.application.ports.out;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.capitalfourge.portfoliomanager.domain.Portfolio;

/**
 * Minimal contract test for the ReportGeneratorPort to ensure the interface is wired.
 */
public class ReportGeneratorPortTest {

    @Test
    void portInterfaceExists() throws IOException {
        ReportGeneratorPort port = Mockito.mock(ReportGeneratorPort.class);
        assertNotNull(port);
    }
}
