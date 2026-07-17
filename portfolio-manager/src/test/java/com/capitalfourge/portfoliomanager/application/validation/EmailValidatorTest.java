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
            assertTrue(validator.validate("juan.perez@empresa.com").valid());
            assertTrue(validator.validate("analista@banco.com.co").valid());
            assertTrue(validator.validate("trader@inversiones.cl").valid());
            assertTrue(validator.validate("soporte@mi-empresa.io").valid());
            assertTrue(validator.validate("user.name+tag@domain.com").valid());
        }

        @Test
        @DisplayName("Should accept emails with subdomains")
        void shouldAcceptSubdomains() {
            assertTrue(validator.validate("user@mail.empresa.com").valid());
            assertTrue(validator.validate("usuario@sub.domain.org").valid());
        }

        @Test
        @DisplayName("Should accept emails with numbers and special chars")
        void shouldAcceptSpecialChars() {
            assertTrue(validator.validate("user123@example.com").valid());
            assertTrue(validator.validate("user.name@example.com").valid());
            assertTrue(validator.validate("user_name@example-domain.com").valid());
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
            assertFalse(validator.validate(email).valid(), "Expected invalid: " + email);
        }

        @Test
        @DisplayName("Should reject leading/trailing dots in local part")
        void shouldRejectLocalPartDots() {
            assertFalse(validator.validate(".user@domain.com").valid());
            assertFalse(validator.validate("user.@domain.com").valid());
            assertFalse(validator.validate("user..name@domain.com").valid());
        }

        @Test
        @DisplayName("Should reject leading/trailing dots in domain")
        void shouldRejectDomainDots() {
            assertFalse(validator.validate("user@.domain.com").valid());
            assertFalse(validator.validate("user@domain.com.").valid());
            assertFalse(validator.validate("user@domain..com").valid());
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
            "user@spamgourmet.com"
        })
        void shouldRejectDisposable(String email) {
            EmailValidator.ValidationResult result = validator.validate(email);
            assertFalse(result.valid(), "Expected invalid (disposable): " + email);
            assertEquals("No se permiten correos temporales o desechables", result.reason());
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
            "test@example.com",
            "demo@example.com",
            "noreply@example.com"
        })
        void shouldRejectBotLike(String email) {
            EmailValidator.ValidationResult result = validator.validate(email);
            assertFalse(result.valid(), "Expected invalid (bot-like): " + email);
        }

        @Test
        @DisplayName("Should accept emails that CONTAIN bot words but don't start with them")
        void shouldAcceptNonStartingBotWords() {
            assertTrue(validator.validate("mybotuser@example.com").valid());
            assertTrue(validator.validate("testuser123@example.com").valid());
        }
    }

    @Nested
    @DisplayName("Invalid emails - suspicious local parts")
    class SuspiciousLocalParts {
        @Test
        @DisplayName("Should reject test/fake/temp/dummy as EXACT local part")
        void shouldRejectSuspiciousExactMatch() {
            assertFalse(validator.validate("test@example.com").valid());
            assertFalse(validator.validate("fake@example.com").valid());
            assertFalse(validator.validate("temp@example.com").valid());
            assertFalse(validator.validate("spam@example.com").valid());
            assertFalse(validator.validate("bot@example.com").valid());
            assertFalse(validator.validate("dummy@example.com").valid());
        }

        @Test
        @DisplayName("Should accept emails that contain bot words but aren't exact match")
        void shouldAcceptContainingBotWords() {
            assertTrue(validator.validate("testuser123@example.com").valid());
            assertTrue(validator.validate("myfakeaccount@example.com").valid());
            assertTrue(validator.validate("tempworker@example.com").valid());
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {
        @Test
        @DisplayName("Should reject null/empty")
        void shouldRejectNullEmpty() {
            assertFalse(validator.validate(null).valid());
            assertFalse(validator.validate("").valid());
            assertFalse(validator.validate("   ").valid());
        }

        @Test
        @DisplayName("Should reject emails too long")
        void shouldRejectTooLong() {
            String longEmail = "a".repeat(100) + "@domain.com";
            assertFalse(validator.validate(longEmail).valid());
        }

        @Test
        @DisplayName("Should reject local part too long")
        void shouldRejectLocalPartTooLong() {
            String longLocal = "a".repeat(65) + "@domain.com";
            assertFalse(validator.validate(longLocal).valid());
        }

        @Test
        @DisplayName("Should reject consecutive dots")
        void shouldRejectConsecutiveDots() {
            assertFalse(validator.validate("user@ex..ample.com").valid());
            assertFalse(validator.validate("user@.example.com").valid());
            assertFalse(validator.validate("user@example.com.").valid());
        }
    }
}
