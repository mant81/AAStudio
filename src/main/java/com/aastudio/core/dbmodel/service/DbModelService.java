package com.aastudio.core.dbmodel.service;

import com.aastudio.core.dbmodel.mapper.DbModelMapper;
import java.util.Map;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DbModelService {

    private final DbModelMapper dbModelMapper;

    public DbModelService(DbModelMapper dbModelMapper) {
        this.dbModelMapper = dbModelMapper;
    }

    public Map<String, Object> getDocument(String projectId) {
        return dbModelMapper.selectDocument(projectId);
    }

    @Transactional
    public List<Map<String, Object>> getCategories(String projectId) {
        List<Map<String, Object>> categories = dbModelMapper.selectCategories(projectId);
        if (!categories.isEmpty() || dbModelMapper.countCategoryDocuments(projectId) > 0) return categories;
        Map<String, Object> legacy = dbModelMapper.selectDocument(projectId);
        insertCategoryDocument(projectId, "ecommerce", "E-Commerce Schema",
                legacy == null ? "" : String.valueOf(legacy.getOrDefault("schemaText", "")),
                legacy == null ? "{}" : String.valueOf(legacy.getOrDefault("layoutJson", "{}")));
        insertCategoryDocument(projectId, "core", "Core Schema", "", "{}");
        insertCategoryDocument(projectId, "analytics", "Analytics Schema", "", "{}");
        return dbModelMapper.selectCategories(projectId);
    }

    public Map<String, Object> getCategoryDocument(String projectId, String categoryId) {
        return dbModelMapper.selectCategoryDocument(projectId, categoryId);
    }

    @Transactional
    public void saveCategoryDocument(String projectId, String categoryId, String categoryName,
                                     String schemaText, String layoutJson) {
        if (dbModelMapper.updateCategoryDocument(projectId, categoryId, categoryName, schemaText, layoutJson) == 0) {
            if (dbModelMapper.countCategoryDocument(projectId, categoryId) > 0) {
                throw new IllegalStateException("삭제된 모델링은 저장할 수 없습니다.");
            }
            insertCategoryDocument(projectId, categoryId, categoryName, schemaText, layoutJson);
        }
    }

    public boolean deleteCategoryDocument(String projectId, String categoryId) {
        return dbModelMapper.deleteCategoryDocument(projectId, categoryId) > 0;
    }

    private void insertCategoryDocument(String projectId, String categoryId, String categoryName,
                                        String schemaText, String layoutJson) {
        dbModelMapper.insertCategoryDocument(projectId, categoryId, categoryName, schemaText, layoutJson);
    }

    public void saveDocument(String projectId, String schemaText, String layoutJson) {
        if (dbModelMapper.updateDocument(projectId, schemaText, layoutJson) == 0) {
            dbModelMapper.insertDocument(projectId, schemaText, layoutJson);
        }
    }
}
