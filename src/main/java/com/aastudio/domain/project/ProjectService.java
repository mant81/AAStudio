package com.aastudio.domain.project;

import com.aastudio.mapper.ProjectMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;

    public List<ProjectVO> getProjectList() {
        return projectMapper.selectProjectList();
    }

    public List<ProjectVO> searchProjects(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getProjectList();
        }
        return projectMapper.searchProjectList(keyword.trim());
    }

    public List<ProjectVO> filterProjects(String keyword, String status) {
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        if (!hasKeyword && !hasStatus) {
            return getProjectList();
        }

        if (hasKeyword && hasStatus) {
            return projectMapper.searchProjectListWithStatus(keyword.trim(), status.trim());
        }

        if (hasKeyword) {
            return searchProjects(keyword);
        }

        return projectMapper.searchProjectListByStatus(status.trim());
    }

    public long getProjectCount() {
        return projectMapper.countProjects();
    }

    public long getProjectCountByStatus(String status) {
        if (status == null || status.isBlank()) {
            return 0L;
        }
        return projectMapper.countProjectsByStatus(status.trim());
    }

    public ProjectVO getProject(Long id) {
        return projectMapper.selectProjectById(id);
    }

    public void createProject(ProjectVO projectVO) {
        projectMapper.insertProject(projectVO);
    }

    public ProjectVO copyProject(Long id) {
        ProjectVO source = getProject(id);
        if (source == null) {
            return null;
        }

        ProjectVO copy = ProjectVO.builder()
                .name(source.getName() + " Copy")
                .description(source.getDescription())
                .rootPath(source.getRootPath())
                .currentStage(source.getCurrentStage())
                .status(source.getStatus())
                .build();
        createProject(copy);
        return copy;
    }

    public void updateProject(ProjectVO projectVO) {
        projectMapper.updateProject(projectVO);
    }

    public void deleteProject(Long id) {
        projectMapper.deleteProject(id);
    }

    public void updateCurrentStage(Long id, String currentStage) {
        projectMapper.updateCurrentStage(id, currentStage == null ? "" : currentStage.trim());
    }
}
