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
        diagramMapper.ensureDocumentGroupColumn();
    }

    public java.util.List<Map<String, Object>> getDocuments(String project_id) {
        return diagramMapper.selectDocuments(project_id);
    }

    public void createDocument(String project_id, String diagram_id, String group_name, String diagram_name) {
        saveState(project_id, diagram_id, group_name, diagram_name, Map.of(
                "nodes", java.util.List.of(),
                "lines", java.util.List.of(),
                "nodeCounter", 0
        ));
    }

    public Map<String, Object> getState(String project_id, String diagram_id) {
        String state_json = diagramMapper.selectStateJson(project_id, diagram_id);
        if (state_json == null) {
            return null;
        }
        return objectMapper.readValue(state_json, new TypeReference<Map<String, Object>>() { });
    }

    public void saveState(String project_id, String diagram_id, String group_name, String diagram_name, Map<String, Object> state) {
        String state_json = objectMapper.writeValueAsString(state);
        int updated_count = diagramMapper.updateDocument(project_id, diagram_id, group_name, diagram_name, state_json);
        if (updated_count == 0) {
            diagramMapper.insertDocument(project_id, diagram_id, group_name, diagram_name, state_json);
        }
    }

    public void deleteDocument(String project_id, String diagram_id) {
        diagramMapper.deleteDocument(project_id, diagram_id);
    }
}
