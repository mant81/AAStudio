package com.aastudio.core.dbmodel.mapper;

import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DbModelMapper {

    Map<String, Object> selectDocument(@Param("projectId") String projectId);

    java.util.List<Map<String, Object>> selectCategories(@Param("projectId") String projectId);

    int countCategoryDocuments(@Param("projectId") String projectId);

    int countCategoryDocument(@Param("projectId") String projectId, @Param("categoryId") String categoryId);

    int deleteCategoryDocument(@Param("projectId") String projectId, @Param("categoryId") String categoryId);

    Map<String, Object> selectCategoryDocument(@Param("projectId") String projectId,
                                               @Param("categoryId") String categoryId);

    int insertCategoryDocument(@Param("projectId") String projectId,
                               @Param("categoryId") String categoryId,
                               @Param("categoryName") String categoryName,
                               @Param("schemaText") String schemaText,
                               @Param("layoutJson") String layoutJson);

    int updateCategoryDocument(@Param("projectId") String projectId,
                               @Param("categoryId") String categoryId,
                               @Param("categoryName") String categoryName,
                               @Param("schemaText") String schemaText,
                               @Param("layoutJson") String layoutJson);

    int insertDocument(@Param("projectId") String projectId,
                       @Param("schemaText") String schemaText,
                       @Param("layoutJson") String layoutJson);

    int updateDocument(@Param("projectId") String projectId,
                       @Param("schemaText") String schemaText,
                       @Param("layoutJson") String layoutJson);
}
