package com.aastudio.core.dbmodel;

import static org.junit.jupiter.api.Assertions.*;

import com.aastudio.core.dbmodel.service.DbModelService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:db-model-tests;MODE=MariaDB;DB_CLOSE_DELAY=-1",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN"
})
@Transactional
class DbModelServiceTest {
    @Autowired
    private DbModelService service;

    @Test
    void renamingPreservesCodeAndLayout() {
        String source = "Table users { id int [pk] }";
        String layout = "{\"users\":{\"x\":120,\"y\":80}}";
        service.saveCategoryDocument("qa-rename", "model", "Before", source, layout);
        service.saveCategoryDocument("qa-rename", "model", "After", source, layout);
        var saved = service.getCategoryDocument("qa-rename", "model");
        assertEquals("After", saved.get("categoryName"));
        assertEquals(source, saved.get("schemaText"));
        assertEquals(layout, saved.get("layoutJson"));
    }

    @Test
    void deletionIsScopedToTheProject() {
        service.saveCategoryDocument("qa-a", "same-id", "A", "Table a { id int }", "{}");
        service.saveCategoryDocument("qa-b", "same-id", "B", "Table b { id int }", "{}");
        assertTrue(service.deleteCategoryDocument("qa-a", "same-id"));
        assertNull(service.getCategoryDocument("qa-a", "same-id"));
        assertNotNull(service.getCategoryDocument("qa-b", "same-id"));
        assertFalse(service.deleteCategoryDocument("qa-a", "same-id"));
    }

    @Test
    void lastDeletionDoesNotReseedOrAcceptStaleAutosave() {
        service.saveCategoryDocument("qa-last", "only", "Only", "Table a { id int }", "{}");
        assertTrue(service.deleteCategoryDocument("qa-last", "only"));
        assertTrue(service.getCategories("qa-last").isEmpty());
        assertThrows(IllegalStateException.class, () ->
                service.saveCategoryDocument("qa-last", "only", "Stale", "Table a { id int }", "{}"));
        assertNull(service.getCategoryDocument("qa-last", "only"));
        assertTrue(service.getCategories("qa-last").isEmpty());
    }
}
