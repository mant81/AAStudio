package com.aastudio.mapper;

import com.aastudio.domain.project.ProjectVO;
import java.util.List;

public interface ProjectMapper {
    List<ProjectVO> selectProjectList();
    List<ProjectVO> searchProjectList(String keyword);
    List<ProjectVO> searchProjectListByStatus(String status);
    List<ProjectVO> searchProjectListWithStatus(String keyword, String status);
    long countProjects();
    long countProjectsByStatus(String status);
    ProjectVO selectProjectById(Long id);
    int insertProject(ProjectVO projectVO);
    int updateProject(ProjectVO projectVO);
    int deleteProject(Long id);
    int updateCurrentStage(@org.apache.ibatis.annotations.Param("id") Long id,
                           @org.apache.ibatis.annotations.Param("currentStage") String currentStage);
}
