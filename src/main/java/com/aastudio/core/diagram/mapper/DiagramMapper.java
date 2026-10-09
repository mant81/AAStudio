package com.aastudio.core.diagram.mapper;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DiagramMapper {

    void ensureDocumentTable();

    Map<String, Object> selectDocument(@Param("diagramId") String diagramId);

    int insertDocument(@Param("diagramId") String diagramId,
                       @Param("diagramName") String diagramName,
                       @Param("stateJson") String stateJson);

    int updateDocument(@Param("diagramId") String diagramId,
                       @Param("diagramName") String diagramName,
                       @Param("stateJson") String stateJson);
}
