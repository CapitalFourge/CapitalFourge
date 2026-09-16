package com.capitalfourge.portfoliomanager.application.exception;

public class InsufficientAssetsException extends RuntimeException {
    public InsufficientAssetsException(String message) {
        super(message);
    }
}