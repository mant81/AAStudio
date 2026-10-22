package com.aastudio.core.web;

import com.aastudio.core.dbmodel.service.DbModelService;
import com.aastudio.core.project.service.ProjectService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/db-modeling/schema")
public class DbModelController {

    private final DbModelService dbModelService;
    private final ProjectService projectService;

    public DbModelController(DbModelService dbModelService, ProjectService projectService) {
        this.dbModelService = dbModelService;
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSchema(
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId,
            @RequestParam(value = "categoryId", required = false, defaultValue = "ecommerce") String categoryId
    ) {
        String resolvedProjectId = projectService.getProjectIdOrDefault(projectId);
        Map<String, Object> document = dbModelService.getCategoryDocument(resolvedProjectId, categoryId);
        Map<String, Object> response = new java.util.HashMap<>();
        if (document != null) response.putAll(document);
        response.put("categoryId", categoryId);
        response.put("categories", dbModelService.getCategories(resolvedProjectId));
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Void> saveSchema(
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId,
            @RequestParam(value = "categoryId", required = false, defaultValue = "ecommerce") String categoryId,
            @RequestParam(value = "categoryName", required = false, defaultValue = "E-Commerce Schema") String categoryName,
            @RequestBody Map<String, Object> request
    ) {
        if (categoryId.isBlank() || categoryId.length() > 64 || categoryName.isBlank() || categoryName.length() > 120) {
            return ResponseEntity.badRequest().build();
        }
        Object schemaText = request.get("schemaText");
        if (!(schemaText instanceof String text) || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Object layoutValue = request.get("layoutJson");
        String layoutJson = layoutValue instanceof String value && !value.isBlank() ? value : "{}";
        try {
            dbModelService.saveCategoryDocument(projectService.getProjectIdOrDefault(projectId), categoryId, categoryName, text, layoutJson);
        } catch (IllegalStateException error) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteSchema(
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId,
            @RequestParam String categoryId
    ) {
        if (categoryId.isBlank() || categoryId.length() > 64) return ResponseEntity.badRequest().build();
        return dbModelService.deleteCategoryDocument(projectService.getProjectIdOrDefault(projectId), categoryId)
                ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
