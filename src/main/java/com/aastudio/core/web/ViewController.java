package com.aastudio.core.web;

import com.aastudio.core.dashboard.service.DashboardService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    private final DashboardService dashboardService;

    public ViewController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/")
    public String dashboard(Model model) {
        model.addAttribute("pageTitle", "Studio Dashboard");
        model.addAttribute("pageDescription", "Project Alpha Operations");
        model.addAttribute("activeNav", "dashboard");
        model.addAttribute("metricCards", dashboardService.getMetricCards());
        model.addAttribute("activityLogs", dashboardService.getActivityLogs());
        model.addAttribute("quickActions", dashboardService.getQuickActions());
        model.addAttribute("statusItems", dashboardService.getStatusItems());
        return "dashboard";
    }

    @GetMapping("/diagram")
    public String diagram(Model model) {
        model.addAttribute("pageTitle", "Microservices Architecture v2");
        model.addAttribute("pageDescription", "Interactive system diagram workspace");
        model.addAttribute("activeNav", "diagram");
        return "diagram";
    }

    @GetMapping("/db-modeling")
    public String dbModeling(Model model) {
        model.addAttribute("pageTitle", "E-Commerce Schema");
        model.addAttribute("pageDescription", "ERD workspace and table explorer");
        model.addAttribute("activeNav", "db-modeling");
        return "db-modeling";
    }

    @GetMapping("/api")
    public String api(Model model) {
        model.addAttribute("pageTitle", "API Specification");
        model.addAttribute("pageDescription", "Core Services v2.1.0");
        model.addAttribute("activeNav", "api-specification");
        return "api";
    }

    @GetMapping("/wiki")
    public String wiki(Model model) {
        model.addAttribute("pageTitle", "Architecture Guidelines");
        model.addAttribute("pageDescription", "Engineering knowledge base");
        model.addAttribute("activeNav", "wiki");
        return "wiki";
    }

    @GetMapping("/settings")
    public String settings(Model model) {
        model.addAttribute("pageTitle", "Settings");
        model.addAttribute("pageDescription", "Manage your account, preferences, and studio integrations.");
        model.addAttribute("activeNav", "settings");
        model.addAttribute("profile", dashboardService.getProfile());
        model.addAttribute("teamMembers", dashboardService.getTeamMembers());
        return "settings";
    }
}
