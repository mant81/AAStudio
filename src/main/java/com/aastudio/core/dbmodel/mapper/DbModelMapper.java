package com.aastudio.core.dbmodel.mapper;

import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DbModelMapper {

    Map<String, Object> selectDocument(@Param("projectId") String projectId);

    int insertDocument(@Param("projectId") String projectId,
                       @Param("schemaText") String schemaText);

    int updateDocument(@Param("projectId") String projectId,
                       @Param("schemaText") String schemaText);
}
