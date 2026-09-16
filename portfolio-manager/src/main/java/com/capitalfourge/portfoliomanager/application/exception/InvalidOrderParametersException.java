package com.capitalfourge.portfoliomanager.application.exception;

public class InvalidOrderParametersException extends RuntimeException {
    public InvalidOrderParametersException(String message) {
        super(message);
    }
}