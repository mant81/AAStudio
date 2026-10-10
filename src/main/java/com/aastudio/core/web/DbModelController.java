package com.aastudio.core.web;

import com.aastudio.core.dbmodel.service.DbModelService;
import com.aastudio.core.project.service.ProjectService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/db-modeling")
public class DbModelController {

    private final DbModelService dbModelService;
    private final ProjectService projectService;

    public DbModelController(DbModelService dbModelService, ProjectService projectService) {
        this.dbModelService = dbModelService;
        this.projectService = projectService;
    }

    @GetMapping("/schema")
    public ResponseEntity<Map<String, Object>> getSchema(
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId
    ) {
        Map<String, Object> document = dbModelService.getDocument(projectService.getProjectIdOrDefault(projectId));
        return document == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(document);
    }

    @PutMapping("/schema")
    public ResponseEntity<Void> saveSchema(
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId,
            @RequestBody Map<String, Object> request
    ) {
        Object schemaText = request.get("schemaText");
        if (!(schemaText instanceof String text) || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        dbModelService.saveDocument(projectService.getProjectIdOrDefault(projectId), text);
        return ResponseEntity.noContent().build();
    }
}
