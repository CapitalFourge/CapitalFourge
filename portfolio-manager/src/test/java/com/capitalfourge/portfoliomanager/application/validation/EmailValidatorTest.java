package com.capitalfourge.portfoliomanager.application.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("EmailValidator")
class EmailValidatorTest {

    private final EmailValidator validator = new EmailValidator();

    @Nested
    @DisplayName("Valid emails")
    class ValidEmails {
        @Test
        @DisplayName("Should accept standard business emails")
        void shouldAcceptBusinessEmails() {
            assertTrue(validator.validate("juan.perez@empresa.com").isValid());
            assertTrue(validator.validate("analista@banco.com.co").isValid());
            assertTrue(validator.validate("trader@inversiones.cl").isValid());
            assertTrue(validator.validate("soporte@mi-empresa.io").isValid());
            assertTrue(validator.validate("user.name+tag@domain.com").isValid());
        }

        @Test
        @DisplayName("Should accept emails with subdomains")
        void shouldAcceptSubdomains() {
            assertTrue(validator.validate("user@mail.empresa.com").isValid());
            assertTrue(validator.validate("usuario@sub.domain.org").isValid());
        }

        @Test
        @DisplayName("Should accept emails with numbers and special chars")
        void shouldAcceptSpecialChars() {
            assertTrue(validator.validate("user123@example.com").isValid());
            assertTrue(validator.validate("user.name@example.com").isValid());
            assertTrue(validator.validate("user_name@example-domain.com").isValid());
        }
    }

    @Nested
    @DisplayName("Invalid emails - format")
    class InvalidFormat {
        @ParameterizedTest
        @DisplayName("Should reject malformed emails")
        @ValueSource(strings = {
            "invalid",
            "invalid@",
            "@domain.com",
            "user@domain",
            "user@.com",
            "user@domain..com",
            "user@domain com"
        })
        void shouldRejectMalformed(String email) {
            assertFalse(validator.validate(email).isValid(), "Expected invalid: " + email);
        }

        @Test
        @DisplayName("Should reject leading/trailing dots in local part")
        void shouldRejectLocalPartDots() {
            assertFalse(validator.validate(".user@domain.com").isValid());
            assertFalse(validator.validate("user.@domain.com").isValid());
            assertFalse(validator.validate("user..name@domain.com").isValid());
        }

        @Test
        @DisplayName("Should reject leading/trailing dots in domain")
        void shouldRejectDomainDots() {
            assertFalse(validator.validate("user@.domain.com").isValid());
            assertFalse(validator.validate("user@domain.com.").isValid());
            assertFalse(validator.validate("user@domain..com").isValid());
        }
    }

    @Nested
    @DisplayName("Invalid emails - disposable/temporary")
    class DisposableEmails {
        @ParameterizedTest
        @DisplayName("Should reject disposable email domains")
        @ValueSource(strings = {
            "test@10minutemail.com",
            "user@guerrillamail.com",
            "test@yopmail.com",
            "user@tempmail.org",
            "test@throwawaymail.com",
            "user@fakeinbox.com",
            "test@trashmail.com",
            "user@getnada.com",
            "test@mailinator.com",
            "user@maildrop.cc"
        })
        void shouldRejectDisposable(String email) {
            EmailValidator.ValidationResult result = validator.validate(email);
            assertFalse(result.isValid(), "Expected invalid (disposable): " + email);
            assertEquals("Disposable email domains not allowed", result.getMessage());
        }
    }

    @Nested
    @DisplayName("Invalid emails - bot-like patterns")
    class BotLikePatterns {
        @ParameterizedTest
        @DisplayName("Should reject bot-like email patterns at START")
        @ValueSource(strings = {
            "test123@example.com",
            "admin@example.com",
            "bot@example.com",
            "fake@example.com",
            "temp@example.com",
            "spam@example.com",
            "dummy@example.com",
            "demo@example.com",
            "noreply@example.com"
        })
        void shouldRejectBotLike(String email) {
            EmailValidator.ValidationResult result = validator.validate(email);
            assertFalse(result.isValid(), "Expected invalid (bot-like): " + email);
        }

        @Test
        @DisplayName("Should accept emails that CONTAIN bot words but don't start with them")
        void shouldAcceptNonStartingBotWords() {
            assertTrue(validator.validate("mybotuser@example.com").isValid());
            assertTrue(validator.validate("mytestaccount@example.com").isValid());
        }
    }

    @Nested
    @DisplayName("Invalid emails - suspicious local parts")
    class SuspiciousLocalParts {
        @Test
        @DisplayName("Should reject test/fake/temp/dummy as EXACT local part")
        void shouldRejectSuspiciousExactMatch() {
            assertFalse(validator.validate("test@example.com").isValid());
            assertFalse(validator.validate("fake@example.com").isValid());
            assertFalse(validator.validate("temp@example.com").isValid());
            assertFalse(validator.validate("spam@example.com").isValid());
            assertFalse(validator.validate("bot@example.com").isValid());
            assertFalse(validator.validate("dummy@example.com").isValid());
        }

        @Test
        @DisplayName("Should reject emails that start with bot prefixes (testuser, admin123, etc.)")
        void shouldRejectBotPrefixes() {
            assertFalse(validator.validate("testuser123@example.com").isValid());
            assertFalse(validator.validate("admin123@example.com").isValid());
            assertFalse(validator.validate("botmaster@example.com").isValid());
            assertFalse(validator.validate("noreply123@example.com").isValid());
        }

        @Test
        @DisplayName("Should accept emails that contain bot words but don't start with them")
        void shouldAcceptContainingButNotStartingWithBotWords() {
            assertTrue(validator.validate("mybotuser@example.com").isValid());
            assertTrue(validator.validate("mytestaccount@example.com").isValid());
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {
        @Test
        @DisplayName("Should reject null/empty")
        void shouldRejectNullEmpty() {
            assertFalse(validator.validate(null).isValid());
            assertFalse(validator.validate("").isValid());
            assertFalse(validator.validate("   ").isValid());
        }

        @Test
        @DisplayName("Should reject emails too long")
        void shouldRejectTooLong() {
            String longEmail = "a".repeat(100) + "@domain.com";
            assertFalse(validator.validate(longEmail).isValid());
        }

        @Test
        @DisplayName("Should reject local part too long")
        void shouldRejectLocalPartTooLong() {
            String longLocal = "a".repeat(65) + "@domain.com";
            assertFalse(validator.validate(longLocal).isValid());
        }

        @Test
        @DisplayName("Should reject consecutive dots")
        void shouldRejectConsecutiveDots() {
            assertFalse(validator.validate("user@ex..ample.com").isValid());
            assertFalse(validator.validate("user@.example.com").isValid());
            assertFalse(validator.validate("user@example.com.").isValid());
        }

        @Test
        @DisplayName("Should reject suspicious local parts")
        void shouldRejectSuspiciousLocalParts() {
            assertFalse(validator.validate("root@example.com").isValid());
            assertFalse(validator.validate("webmaster@example.com").isValid());
            assertFalse(validator.validate("postmaster@example.com").isValid());
            assertFalse(validator.validate("abuse@example.com").isValid());
            assertFalse(validator.validate("info@example.com").isValid());
            assertFalse(validator.validate("support@example.com").isValid());
        }
    }
}