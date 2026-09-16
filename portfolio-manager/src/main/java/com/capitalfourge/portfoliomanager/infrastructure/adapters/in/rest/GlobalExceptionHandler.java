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

import com.capitalfourge.portfoliomanager.application.exception.AccountDisabledException;
import com.capitalfourge.portfoliomanager.application.exception.ConcurrencyConflictException;
import com.capitalfourge.portfoliomanager.application.exception.DuplicatePortfolioNameException;
import com.capitalfourge.portfoliomanager.application.exception.EmailAlreadyRegisteredException;
import com.capitalfourge.portfoliomanager.application.exception.InsufficientAssetsException;
import com.capitalfourge.portfoliomanager.application.exception.InsufficientBalanceException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidCredentialsException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidOrderParametersException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidOrderStateException;
import com.capitalfourge.portfoliomanager.application.exception.InvalidRefreshTokenException;
import com.capitalfourge.portfoliomanager.application.exception.OrderNotFoundException;
import com.capitalfourge.portfoliomanager.application.exception.PortfolioNotFoundException;
import com.capitalfourge.portfoliomanager.application.exception.UserNotFoundException;

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

    @ExceptionHandler(DuplicatePortfolioNameException.class)
    public ResponseEntity<Map<String, String>> handleDuplicatePortfolioName(DuplicatePortfolioNameException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientBalance(InsufficientBalanceException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Saldo insuficiente");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InsufficientAssetsException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientAssets(InsufficientAssetsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "No hay suficientes activos para vender");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(PortfolioNotFoundException.class)
    public ResponseEntity<Map<String, String>> handlePortfolioNotFound(PortfolioNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Portafolio no encontrado");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleOrderNotFound(OrderNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Orden no encontrada");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UserNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Usuario no encontrado");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(InvalidOrderParametersException.class)
    public ResponseEntity<Map<String, String>> handleInvalidOrderParameters(InvalidOrderParametersException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InvalidOrderStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidOrderState(InvalidOrderStateException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Credenciales inválidas");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<Map<String, String>> handleAccountDisabled(AccountDisabledException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Cuenta deshabilitada");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "Token de actualización inválido o revocado");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(ConcurrencyConflictException.class)
    public ResponseEntity<Map<String, String>> handleConcurrencyConflict(ConcurrencyConflictException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        // fallback for other runtime exceptions
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

}