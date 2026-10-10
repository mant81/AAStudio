package com.aastudio.core.project.service;

import com.aastudio.core.project.mapper.ProjectMapper;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

    private final ProjectMapper projectMapper;

    public ProjectService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public List<Map<String, Object>> getProjects() {
        return projectMapper.selectProjects();
    }

    public Map<String, Object> getProjectOrDefault(String projectId) {
        Map<String, Object> project = projectId == null ? null : projectMapper.selectProject(projectId);
        if (project != null) {
            return project;
        }
        List<Map<String, Object>> projects = projectMapper.selectProjects();
        return projects.isEmpty() ? null : projects.get(0);
    }

    public String getProjectIdOrDefault(String projectId) {
        Map<String, Object> project = getProjectOrDefault(projectId);
        return project == null ? null : String.valueOf(project.get("projectId"));
    }

    public Map<String, Object> createProject(String name, String description) {
        String projectName = name == null ? "" : name.trim();
        if (projectName.isBlank()) {
            throw new IllegalArgumentException("프로젝트 이름을 입력하세요.");
        }
        String slug = Normalizer.normalize(projectName, Normalizer.Form.NFKD)
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
        String projectId = (slug.isBlank() ? "project" : slug) + "-" + UUID.randomUUID().toString().substring(0, 8);
        projectMapper.insertProject(projectId, projectName, description == null ? "" : description.trim());
        return projectMapper.selectProject(projectId);
    }
}
