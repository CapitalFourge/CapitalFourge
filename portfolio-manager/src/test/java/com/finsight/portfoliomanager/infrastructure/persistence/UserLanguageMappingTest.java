package com.finsight.portfoliomanager.infrastructure.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.UserPersistenceAdapter;

/** Tests for language mapping defaults on user language */
public class UserLanguageMappingTest {

    @Test
    void mapsNullLanguageToES() {
        assertEquals("ES", UserPersistenceAdapter.mapLanguage(null));
    }

    @Test
    void preservesNonNullLanguage() {
        assertEquals("EN", UserPersistenceAdapter.mapLanguage("EN"));
    }
}
