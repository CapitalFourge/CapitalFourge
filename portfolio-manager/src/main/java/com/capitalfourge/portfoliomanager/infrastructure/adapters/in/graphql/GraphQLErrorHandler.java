package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolver;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import com.capitalfourge.portfoliomanager.application.exception.AccountDisabledException;
import com.capitalfourge.portfoliomanager.application.exception.ConcurrencyConflictException;
import com.capitalfourge.portfoliomanager.application.exception.DuplicatePortfolioNameException;
import com.capitalfourge.portfoliomanager.application.exception.InsufficientAssetsException;
import com.capitalfourge.portfoliomanager.application.exception.InsufficientBalanceException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidCredentialsException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidOrderParametersException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidOrderStateException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidRefreshTokenException;
import com.capitalfourge.portfoliomanager.application.exception.OrderNotFoundException;
import com.capitalfourge.portfoliomanager.application.exception.PortfolioNotFoundException;
import com.capitalfourge.portfoliomanager.application.exception.UserNotFoundException;

import java.util.List;

@Component
public class GraphQLErrorHandler implements DataFetcherExceptionResolver {
    
    @Override
    public Mono<List<GraphQLError>> resolveException(Throwable exception, DataFetchingEnvironment environment) {
        ErrorType errorType = ErrorType.INTERNAL_ERROR;
        String message = exception.getMessage();
        
        if (exception instanceof InsufficientBalanceException
                || exception instanceof InsufficientAssetsException
                || exception instanceof InvalidOrderParametersException
                || exception instanceof InvalidOrderStateException
                || exception instanceof DuplicatePortfolioNameException
                || exception instanceof ConcurrencyConflictException) {
            errorType = ErrorType.BAD_REQUEST;
        } else if (exception instanceof PortfolioNotFoundException
                || exception instanceof OrderNotFoundException
                || exception instanceof UserNotFoundException) {
            errorType = ErrorType.NOT_FOUND;
        } else if (exception instanceof InvalidCredentialsException
                || exception instanceof InvalidRefreshTokenException
                || exception instanceof AccountDisabledException) {
            errorType = ErrorType.UNAUTHORIZED;
        } else if (exception instanceof RuntimeException) {
            errorType = ErrorType.BAD_REQUEST;
        }
        
        return Mono.just(List.of(GraphQLError.newError()
            .message(message != null ? message : "Internal server error")
            .errorType(errorType)
            .build()));
    }
}
