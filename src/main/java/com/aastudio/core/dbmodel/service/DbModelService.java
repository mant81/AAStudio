package com.aastudio.core.dbmodel.service;

import com.aastudio.core.dbmodel.mapper.DbModelMapper;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DbModelService {

    private final DbModelMapper dbModelMapper;

    public DbModelService(DbModelMapper dbModelMapper) {
        this.dbModelMapper = dbModelMapper;
    }

    public Map<String, Object> getDocument(String projectId) {
        return dbModelMapper.selectDocument(projectId);
    }

    public void saveDocument(String projectId, String schemaText) {
        if (dbModelMapper.updateDocument(projectId, schemaText) == 0) {
            dbModelMapper.insertDocument(projectId, schemaText);
        }
    }
}
