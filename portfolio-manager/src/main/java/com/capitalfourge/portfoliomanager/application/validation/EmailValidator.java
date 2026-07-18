package com.capitalfourge.portfoliomanager.application.validation;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validates email addresses for registration.
 * Checks format, blocks disposable/temporary email domains,
 * and prevents common abuse patterns.
 */
@Component
public class EmailValidator {

    // RFC 5322 compliant regex - allows subdomains and special chars, requires at least one dot in domain
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)+$"
    );

    // Known disposable/temporary email domains
    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
        "10minutemail.com", "10minutemail.net", "20minutemail.com", "guerrillamail.com",
        "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de",
        "sharklasers.com", "grr.la", "spam4.me", "bccto.me", "chacuo.net",
        "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
        "yopmail.com", "yopmail.net", "yopmail.fr",
        "tempmail.com", "tempmail.net", "tempmail.org", "temp-mail.org",
        "throwawaymail.com", "fakeinbox.com", "trashmail.com", "trashmail.net",
        "getairmail.com", "mailnesia.com", "maildrop.cc", "getnada.com",
        "inboxbear.com", "inboxclean.com", "inboxclean.org", "spamgourmet.com",
        "spamgourmet.net", "spamgourmet.org", "mytrashmail.com", "trashmail.me",
        "emailondeck.com", "emailondeck.net", "mintemail.com", "dispostable.com",
        "mytemp.email", "mytempemail.com", "tempemail.com", "tempemail.net"
    );

    // Bot/suspicious local part prefixes
    private static final Set<String> BOT_PREFIXES = Set.of(
        "test", "admin", "bot", "noreply", "fake", "temp", "dummy", "demo", "spam"
    );

    // Suspicious local parts (exact matches)
    private static final Set<String> SUSPICIOUS_LOCAL_PARTS = Set.of(
        "test", "admin", "root", "webmaster", "postmaster", "abuse",
        "noreply", "no-reply", "donotreply", "info", "support"
    );

    /**
     * Validates an email address.
     * @param email the email to validate
     * @return ValidationResult with validity and reason if invalid
     */
    public ValidationResult validate(String email) {
        if (email == null || email.trim().isEmpty()) {
            return ValidationResult.invalid("Email is required");
        }

        String trimmed = email.trim().toLowerCase();

        // 1. Format validation
        if (!EMAIL_PATTERN.matcher(trimmed).matches()) {
            return ValidationResult.invalid("Invalid email format");
        }

        // 2. Length check
        if (trimmed.length() > 254) {
            return ValidationResult.invalid("Email too long (max 254 characters)");
        }

        // 3. Split local part and domain
        int atIndex = trimmed.indexOf('@');
        if (atIndex <= 0 || atIndex == trimmed.length() - 1) {
            return ValidationResult.invalid("Invalid email structure");
        }

        String localPart = trimmed.substring(0, atIndex);
        String domain = trimmed.substring(atIndex + 1);

        // 4. Local part validation
        if (localPart.length() > 64) {
            return ValidationResult.invalid("Local part too long (max 64 characters)");
        }

        if (localPart.contains("..") || localPart.startsWith(".") || localPart.endsWith(".")) {
            return ValidationResult.invalid("Local part has invalid dots");
        }

        // 5. Block disposable/temporary email domains
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return ValidationResult.invalid("Disposable email domains not allowed");
        }

        // 6. Block suspicious bot-like patterns
        if (SUSPICIOUS_LOCAL_PARTS.contains(localPart)) {
            return ValidationResult.invalid("Suspicious email pattern");
        }

        if (BOT_PREFIXES.stream().anyMatch(localPart::startsWith)) {
            return ValidationResult.invalid("Suspicious email pattern");
        }

        // 7. Domain validation
        if (domain.startsWith(".") || domain.endsWith(".") || domain.contains("..")) {
            return ValidationResult.invalid("Invalid domain format");
        }

        // 8. Local part validation - no leading/trailing dots, no consecutive dots
        if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.contains("..")) {
            return ValidationResult.invalid("Invalid email format");
        }

        return ValidationResult.valid();
    }

    /**
     * Checks if an email domain is a known disposable/temporary email provider.
     */
    public boolean isDisposableDomain(String email) {
        if (email == null || !email.contains("@")) return false;
        String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
        return DISPOSABLE_DOMAINS.contains(domain);
    }

    /**
     * Gets the list of blocked disposable domains (for documentation/admin).
     */
    public Set<String> getDisposableDomains() {
        return DISPOSABLE_DOMAINS;
    }

    /**
     * Validation result with detailed reason.
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        private ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}