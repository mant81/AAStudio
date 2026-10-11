package com.aastudio.core.web;

import com.aastudio.core.diagram.service.DiagramService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects/{project_id}/diagrams")
public class DiagramStateController {

    private final DiagramService diagramService;
    public DiagramStateController(DiagramService diagramService) {
        this.diagramService = diagramService;
    }

    @GetMapping("/{diagram_id}/state")
    public ResponseEntity<Map<String, Object>> getState(
            @PathVariable("project_id") String project_id,
            @PathVariable("diagram_id") String diagram_id
    ) {
        Map<String, Object> state = diagramService.getState(project_id, diagram_id);
        if (state == null) {
            return ResponseEntity.notFound()
                    .cacheControl(CacheControl.noStore())
                    .build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(state);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getDocuments(
            @PathVariable("project_id") String project_id
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(diagramService.getDocuments(project_id));
    }

    @PostMapping
    public ResponseEntity<Void> createDocument(
            @PathVariable("project_id") String project_id,
            @RequestBody Map<String, Object> request
    ) {
        String diagram_id = String.valueOf(request.getOrDefault("diagram_id", "")).trim();
        String diagram_name = request.get("diagram_name") instanceof String value ? value.trim() : "";
        String group_name = request.get("group_name") instanceof String value ? value.trim() : "";
        if (diagram_id.isEmpty() || diagram_name.isEmpty() || group_name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        diagramService.createDocument(project_id, diagram_id, group_name, diagram_name);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{diagram_id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable("project_id") String project_id,
            @PathVariable("diagram_id") String diagram_id
    ) {
        diagramService.deleteDocument(project_id, diagram_id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{diagram_id}/state")
    public ResponseEntity<Void> saveState(@PathVariable("project_id") String project_id,
                                          @PathVariable("diagram_id") String diagram_id,
                                          @RequestBody Map<String, Object> request) {
        Object nodes = request.get("nodes");
        Object lines = request.get("lines");
        if (nodes == null || lines == null) {
            return ResponseEntity.badRequest().build();
        }
        String diagram_name = request.get("diagram_name") instanceof String value ? value.trim() : "";
        String group_name = request.get("group_name") instanceof String value ? value.trim() : "";
        if (diagram_name.isEmpty() || group_name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        diagramService.saveState(project_id, diagram_id, group_name, diagram_name, Map.of(
                "nodes", nodes,
                "lines", lines,
                "nodeCounter", request.getOrDefault("nodeCounter", 0)
        ));
        return ResponseEntity.noContent().build();
    }
}
