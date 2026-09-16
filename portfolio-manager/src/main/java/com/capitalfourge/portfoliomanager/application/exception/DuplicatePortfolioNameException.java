package com.capitalfourge.portfoliomanager.application.exception;

public class DuplicatePortfolioNameException extends RuntimeException {
    public DuplicatePortfolioNameException(String message) {
        super(message);
    }
}