package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolver;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class GraphQLErrorHandler implements DataFetcherExceptionResolver {
    
    @Override
    public Mono<List<GraphQLError>> resolveException(Throwable exception, DataFetchingEnvironment environment) {
        if (exception instanceof RuntimeException) {
            return Mono.just(List.of(GraphQLError.newError()
                .message(exception.getMessage())
                .errorType(ErrorType.BAD_REQUEST)
                .build()));
        }
        return Mono.just(List.of(GraphQLError.newError()
            .message("Internal server error")
            .errorType(ErrorType.INTERNAL_ERROR)
            .build()));
    }
}
