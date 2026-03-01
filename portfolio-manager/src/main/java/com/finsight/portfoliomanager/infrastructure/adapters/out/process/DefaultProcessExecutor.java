package com.finsight.portfoliomanager.infrastructure.adapters.out.process;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;

import org.springframework.stereotype.Component;

import com.finsight.portfoliomanager.application.ports.out.ProcessExecutor;

@Component
public class DefaultProcessExecutor implements ProcessExecutor {
    @Override
    public int execute(List<String> command) throws IOException, InterruptedException {
        return executeWithOutput(command).exitCode;
    }

    @Override
    public ExecutionResult executeWithOutput(List<String> command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
                output.append(line).append(System.lineSeparator());
            }
        }
        int exitCode = process.waitFor();
        return new ExecutionResult(exitCode, output.toString());
    }
}
