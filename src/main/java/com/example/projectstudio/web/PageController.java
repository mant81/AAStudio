package com.example.projectstudio.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "home";
    }

    @GetMapping("/demo")
    public String demo() {
        return "demo";
    }

    @GetMapping("/privacy")
    public String privacy() {
        return "privacy";
    }

    @GetMapping("/project")
    public String project() {
        return "project";
    }

    @GetMapping("/project/new")
    public String projectNew() {
        return "project-new";
    }

    @GetMapping("/share")
    public String share() {
        return "share";
    }

    @GetMapping("/workspace")
    public String workspace() {
        return "workspace";
    }

    @GetMapping("/project/{id}")
    public String projectDetail(@PathVariable String id, Model model) {
        model.addAttribute("projectId", id);
        return "project-detail";
    }

    @GetMapping("/project/{id}/{section}")
    public String projectSection(@PathVariable String id, @PathVariable String section, Model model) {
        model.addAttribute("projectId", id);
        model.addAttribute("section", section);
        return "project-detail";
    }
}
