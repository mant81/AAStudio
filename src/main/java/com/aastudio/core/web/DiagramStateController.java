package com.aastudio.core.web;

import com.aastudio.core.diagram.service.DiagramService;
import com.aastudio.core.project.service.ProjectService;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagrams")
public class DiagramStateController {

    private final DiagramService diagramService;
    private final ProjectService projectService;

    public DiagramStateController(DiagramService diagramService, ProjectService projectService) {
        this.diagramService = diagramService;
        this.projectService = projectService;
    }

    @GetMapping("/{diagramId}/state")
    public ResponseEntity<Map<String, Object>> getState(
            @PathVariable String diagramId,
            @CookieValue(value = "aastudio.currentProject", required = false) String projectId
    ) throws JsonProcessingException {
        Map<String, Object> state = diagramService.getState(projectService.getProjectIdOrDefault(projectId), diagramId);
        if (state == null) {
            return ResponseEntity.notFound()
                    .cacheControl(CacheControl.noStore())
                    .build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(state);
    }

    @PutMapping("/{diagramId}/state")
    public ResponseEntity<Void> saveState(@PathVariable String diagramId,
                                          @RequestBody Map<String, Object> request,
                                          @CookieValue(value = "aastudio.currentProject", required = false) String projectId) throws JsonProcessingException {
        Object nodes = request.get("nodes");
        Object lines = request.get("lines");
        if (!(nodes instanceof List<?>) || !(lines instanceof List<?>)) {
            return ResponseEntity.badRequest().build();
        }
        String diagramName = String.valueOf(request.getOrDefault("diagramName", diagramId));
        diagramService.saveState(projectService.getProjectIdOrDefault(projectId), diagramId, diagramName, Map.of(
                "nodes", nodes,
                "lines", lines,
                "nodeCounter", request.getOrDefault("nodeCounter", 0)
        ));
        return ResponseEntity.noContent().build();
    }
}
