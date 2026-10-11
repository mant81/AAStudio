package com.aastudio.core.diagram.mapper;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DiagramMapper {

    void ensureDocumentTable();

    void ensureDocumentGroupColumn();

    java.util.List<Map<String, Object>> selectDocuments(@Param("project_id") String project_id);

    Map<String, Object> selectDocument(@Param("project_id") String project_id,
                                        @Param("diagram_id") String diagram_id);

    String selectStateJson(@Param("project_id") String project_id,
                           @Param("diagram_id") String diagram_id);

    int insertDocument(@Param("project_id") String project_id,
                       @Param("diagram_id") String diagram_id,
                       @Param("group_name") String group_name,
                       @Param("diagram_name") String diagram_name,
                       @Param("state_json") String state_json);

    int updateDocument(@Param("project_id") String project_id,
                       @Param("diagram_id") String diagram_id,
                       @Param("group_name") String group_name,
                       @Param("diagram_name") String diagram_name,
                       @Param("state_json") String state_json);

    int deleteDocument(@Param("project_id") String project_id,
                       @Param("diagram_id") String diagram_id);
}
