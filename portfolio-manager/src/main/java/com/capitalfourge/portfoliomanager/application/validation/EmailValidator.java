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

    // More permissive RFC 5322 compliant regex - allows subdomains and special chars
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$"
    );

    // Known disposable/temporary email domains (subset - expand as needed)
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

    // Suspicious patterns (bot-like usernames) - matches at START of email, 
    // only if the suspicious word is the COMPLETE local part (optionally with numbers)
    private static final Pattern BOT_PATTERN = Pattern.compile(
        "^(test|admin|root|info|support|sales|noreply|no-reply|bot|demo|sample|temp|fake|dummy|noreply)[0-9]*@"
    );

    // Suspicious exact local parts (complete match)
    private static final Set<String> SUSPICIOUS_LOCAL_PARTS = Set.of(
        "test", "fake", "dummy", "temp", "trash", "spam", "bot", "admin", "root"
    );

    /**
     * Validation result with detailed reason.
     */
    public record ValidationResult(boolean valid, String reason) {
        public static ValidationResult ok() { return new ValidationResult(true, null); }
        public static ValidationResult invalid(String reason) { return new ValidationResult(false, reason); }
    }

    /**
     * Validates an email address.
     * @param email the email to validate
     * @return ValidationResult with validity and reason if invalid
     */
    public ValidationResult validate(String email) {
        if (email == null || email.trim().isEmpty()) {
            return ValidationResult.invalid("El correo es obligatorio");
        }

        String normalized = email.trim().toLowerCase();

        // 1. Format validation
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            return ValidationResult.invalid("Formato de correo inválido");
        }

        // 2. Length check
        if (normalized.length() > 254) {
            return ValidationResult.invalid("El correo es demasiado largo");
        }

        // 3. Split local part and domain
        String[] parts = normalized.split("@");
        if (parts.length != 2) {
            return ValidationResult.invalid("Formato de correo inválido");
        }

        String localPart = parts[0];
        String domain = parts[1];

        // 4. Local part length
        if (localPart.length() > 64) {
            return ValidationResult.invalid("La parte local del correo es demasiado larga");
        }

        // 5. Block disposable/temporary email domains
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return ValidationResult.invalid("No se permiten correos temporales o desechables");
        }

        // 6. Block suspicious bot-like patterns at START of email
        // (only matches if suspicious word is the complete local part optionally followed by numbers)
        if (BOT_PATTERN.matcher(normalized).find()) {
            return ValidationResult.invalid("El correo parece generado automáticamente");
        }

        // 7. Block suspicious exact local parts
        if (SUSPICIOUS_LOCAL_PARTS.contains(localPart)) {
            return ValidationResult.invalid("El correo parece generado automáticamente");
        }

        // 7b. Block suspicious local parts that START with these words + numbers only
        if (localPart.matches("^(test|fake|dummy|temp|trash|spam|bot|admin|root)[0-9]*$")) {
            return ValidationResult.invalid("El correo parece generado automáticamente");
        }

        // 8. Domain structure validation (at least one dot, no consecutive dots)
        if (!domain.contains(".") || domain.startsWith(".") || domain.endsWith(".") || domain.contains("..")) {
            return ValidationResult.invalid("Dominio de correo inválido");
        }

        // 9. Local part validation - no leading/trailing dots, no consecutive dots
        if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.contains("..")) {
            return ValidationResult.invalid("Formato de correo inválido");
        }

        return ValidationResult.ok();
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
}
