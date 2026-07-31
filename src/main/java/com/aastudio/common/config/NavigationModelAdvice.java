package com.aastudio.common.config;

import com.aastudio.domain.project.ProjectService;
import com.aastudio.domain.project.ProjectVO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@RequiredArgsConstructor
public class NavigationModelAdvice {
    private final ProjectService projectService;

    @ModelAttribute("recentProjects")
    public List<ProjectVO> recentProjects(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken
                || !authentication.isAuthenticated()) {
            return List.of();
        }
        return projectService.getProjectList().stream().limit(5).toList();
    }
}
