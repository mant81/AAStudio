package com.aastudio.core.web;

import com.aastudio.core.project.service.ProjectService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class LayoutModelFactory {

    private final ProjectService projectService;

    public LayoutModelFactory(ProjectService projectService) {
        this.projectService = projectService;
    }

    @ModelAttribute("navigationItems")
    public List<Map<String, String>> navigationItems() {
        return List.of();
    }

    @ModelAttribute
    public void projectContext(
        @CookieValue(value = "aastudio.currentProject", required = false) String projectId,
        org.springframework.ui.Model model
    ) {
        model.addAttribute("projects", projectService.getProjects());
        Map<String, Object> currentProject = projectService.getProjectOrDefault(projectId);
        model.addAttribute("currentProject", currentProject);
        model.addAttribute("currentProjectId", currentProject == null ? "" : currentProject.get("projectId"));
    }
}
