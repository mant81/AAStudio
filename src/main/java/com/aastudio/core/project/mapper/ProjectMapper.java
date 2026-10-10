package com.aastudio.core.project.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ProjectMapper {

    List<Map<String, Object>> selectProjects();

    Map<String, Object> selectProject(@Param("projectId") String projectId);

    int insertProject(@Param("projectId") String projectId,
                      @Param("projectName") String projectName,
                      @Param("description") String description);
}
