package com.aastudio.core.diagram.service;

import com.aastudio.core.diagram.mapper.DiagramMapper;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DiagramService {

    private final DiagramMapper diagramMapper;
    private final ObjectMapper objectMapper;

    public DiagramService(DiagramMapper diagramMapper, ObjectMapper objectMapper) {
        this.diagramMapper = diagramMapper;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void ensureDocumentTable() {
        diagramMapper.ensureDocumentTable();
    }

    public Map<String, Object> getState(String projectId, String diagramId) {
        String stateJson = diagramMapper.selectStateJson(projectId, diagramId);
        if (stateJson == null) {
            return null;
        }
        return objectMapper.readValue(stateJson, new TypeReference<Map<String, Object>>() { });
    }

    public void saveState(String projectId, String diagramId, String diagramName, Map<String, Object> state) {
        String stateJson = objectMapper.writeValueAsString(state);
        if (diagramMapper.updateDocument(projectId, diagramId, diagramName, stateJson) == 0) {
            diagramMapper.insertDocument(projectId, diagramId, diagramName, stateJson);
        }
    }
}
