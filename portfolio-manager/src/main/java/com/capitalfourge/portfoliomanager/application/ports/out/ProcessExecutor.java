package com.capitalfourge.portfoliomanager.application.ports.out;

import java.io.IOException;
import java.util.List;

public interface ProcessExecutor {
    int execute(List<String> command) throws IOException, InterruptedException;

    default ExecutionResult executeWithOutput(List<String> command) throws IOException, InterruptedException {
        throw new UnsupportedOperationException("Not implemented");
    }

    class ExecutionResult {
        public final int exitCode;
        public final String output;

        public ExecutionResult(int exitCode, String output) {
            this.exitCode = exitCode;
            this.output = output;
        }
    }
}
