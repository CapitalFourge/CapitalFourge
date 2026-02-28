package com.finsight.portfoliomanager.application.ports.out;

import java.io.IOException;
import java.util.List;

public interface ProcessExecutor {
    int execute(List<String> command) throws IOException, InterruptedException;
}
