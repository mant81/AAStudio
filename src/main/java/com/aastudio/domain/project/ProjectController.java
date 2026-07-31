package com.aastudio.domain.project;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/projects/{id}")
    public String detail(@PathVariable Long id, Model model) {
        model.addAttribute("project", projectService.getProject(id));
        return "project/detail";
    }

    @GetMapping("/projects/{id}/edit")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("projectForm", projectService.getProject(id));
        return "project/form";
    }

    @PostMapping("/projects")
    public String createProject(@ModelAttribute("projectForm") ProjectVO projectVO) {
        projectService.createProject(projectVO);
        return "redirect:/";
    }

    @PostMapping("/projects/{id}")
    public String updateProject(@PathVariable Long id, @ModelAttribute("projectForm") ProjectVO projectVO) {
        projectVO.setId(id);
        projectService.updateProject(projectVO);
        return "redirect:/projects/" + id;
    }

    @PostMapping("/projects/{id}/delete")
    public String deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return "redirect:/";
    }

    @PostMapping("/projects/{id}/copy")
    public String copyProject(@PathVariable Long id) {
        ProjectVO copy = projectService.copyProject(id);
        if (copy == null) {
            return "redirect:/";
        }
        return "redirect:/projects/" + copy.getId();
    }
}
