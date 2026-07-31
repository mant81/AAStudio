package com.aastudio.domain.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final com.aastudio.domain.project.ProjectService projectService;
    private final com.aastudio.domain.user.UserService userService;
    private final com.aastudio.domain.code.CodeService codeService;

    @GetMapping("/")
    public String home(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "status", required = false) String status,
            Model model
    ) {
        model.addAttribute("projectCount", projectService.getProjectCount());
        model.addAttribute("projectActiveCount", projectService.getProjectCountByStatus("active"));
        model.addAttribute("projectDraftCount", projectService.getProjectCountByStatus("draft"));
        model.addAttribute("projectArchivedCount", projectService.getProjectCountByStatus("archived"));
        model.addAttribute("userCount", userService.getUserCount());
        model.addAttribute("codeGroupCount", codeService.getCodeGroupCount());
        model.addAttribute("query", q == null ? "" : q);
        model.addAttribute("status", status == null ? "" : status);
        model.addAttribute("projects", projectService.filterProjects(q, status));
        return "project/list";
    }
}
