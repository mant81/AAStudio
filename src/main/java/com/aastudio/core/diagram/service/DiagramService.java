package com.aastudio.core.diagram.service;

import com.aastudio.core.diagram.mapper.DiagramMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.sql.Clob;
import jakarta.annotation.PostConstruct;
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

    public Map<String, Object> getState(String diagramId) throws JsonProcessingException {
        Map<String, Object> document = diagramMapper.selectDocument(diagramId);
        if (document == null) {
            return null;
        }
        return objectMapper.readValue(toJsonString(document.get("stateJson")), Map.class);
    }

    private String toJsonString(Object value) throws JsonProcessingException {
        if (value instanceof Clob clob) {
            try {
                return clob.getSubString(1, (int) clob.length());
            } catch (Exception exception) {
                throw new JsonProcessingException("다이어그램 JSON을 읽을 수 없습니다.", exception) { };
            }
        }
        if (value instanceof byte[] bytes) {
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        }
        return String.valueOf(value);
    }

    public void saveState(String diagramId, String diagramName, Map<String, Object> state) throws JsonProcessingException {
        String stateJson = objectMapper.writeValueAsString(state);
        if (diagramMapper.selectDocument(diagramId) == null) {
            diagramMapper.insertDocument(diagramId, diagramName, stateJson);
        } else {
            diagramMapper.updateDocument(diagramId, diagramName, stateJson);
        }
    }
}
