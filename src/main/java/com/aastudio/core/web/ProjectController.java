package com.aastudio.core.web;

import com.aastudio.core.project.service.ProjectService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(projectService.getProjects());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(
                request.get("name"), request.get("description")
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }
}
