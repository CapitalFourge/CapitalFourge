package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.EntityNotFoundException;

import com.capitalfourge.portfoliomanager.application.exception.EmailAlreadyRegisteredException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        errors.put("status", HttpStatus.BAD_REQUEST.value());
        errors.put("error", "Validation Failed");
        
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        errors.put("fields", fieldErrors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler()
    public ResponseEntity<Map<String, String>> handleInsufficientBalance(InsufficientAuthenticationException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler()
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyRegistered(EmailAlreadyRegisteredException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Este correo ya está registrado");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyRegistered(RuntimeException ex) {
        if ("Email already registered".equals(ex.getMessage())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Este correo ya está registrado");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        // fallback for other runtime exceptions
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

}