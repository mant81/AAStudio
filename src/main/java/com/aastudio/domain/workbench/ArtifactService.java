package com.aastudio.domain.workbench;

import com.aastudio.domain.project.ProjectVO;
import com.aastudio.mapper.WorkbenchMapper;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ArtifactService {
    private final WorkbenchMapper mapper;

    @Transactional
    public void generate(Long projectId, ProjectVO project, String type, String actor) {
        String normalized = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        Artifact artifact = switch (normalized) {
            case "SOURCE_SUMMARY" -> sourceSummary(projectId, project);
            case "CODE_REVIEW" -> codeReview(projectId, project);
            case "SECURITY_REVIEW" -> securityReview(projectId, project);
            case "STANDARD_REPORT" -> standardReport(projectId, project);
            case "STANDARD_CSV" -> standardCsv(projectId, project);
            case "DB_DDL" -> dbDdl(projectId, project);
            case "DIAGRAM_DOCUMENT" -> diagram(projectId, project);
            case "OPENAPI" -> openApi(projectId, project);
            case "API_TEST_REPORT" -> apiTest(projectId, project);
            case "WIKI_DOCUMENT" -> wiki(projectId, project);
            case "WBS_DOCUMENT" -> wbs(projectId, project);
            default -> throw new IllegalArgumentException("지원하지 않는 산출물 유형입니다.");
        };
        mapper.insertArtifact(projectId, normalized, artifact.name(), artifact.content(), actor);
    }

    public Download load(Long projectId, Long artifactId) {
        Map<String, Object> row = mapper.selectArtifact(projectId, artifactId);
        if (row == null) throw new IllegalArgumentException("산출물을 찾을 수 없습니다.");
        String type = v(row, "ARTIFACT_TYPE");
        String extension = switch (type) {
            case "OPENAPI" -> ".json";
            case "DB_DDL" -> ".sql";
            case "STANDARD_CSV" -> ".csv";
            default -> ".md";
        };
        String mimeType = switch (type) {
            case "OPENAPI" -> "application/json";
            case "DB_DDL" -> "application/sql";
            case "STANDARD_CSV" -> "text/csv";
            default -> "text/markdown";
        };
        String baseName = v(row, "NAME").replaceAll("[^\\p{L}\\p{N}._-]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (baseName.isBlank()) baseName = "artifact";
        return new Download(baseName + "-v" + v(row, "VERSION_NO") + extension,
                mimeType, v(row, "CONTENT_TEXT").getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private Artifact sourceSummary(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Source Scan Summary");
        for (Map<String,Object> row : mapper.selectScans(id)) {
            text.append("## ").append(v(row,"SCAN_PATH")).append("\n\n")
                    .append("- Status: ").append(v(row,"STATUS")).append("\n")
                    .append("- Language: ").append(v(row,"LANGUAGE")).append("\n")
                    .append("- Framework: ").append(v(row,"FRAMEWORK")).append("\n")
                    .append("- Files: ").append(v(row,"FILE_COUNT")).append("\n")
                    .append("- Code findings: ").append(v(row,"CODE_ISSUE_COUNT")).append("\n")
                    .append("- Security findings: ").append(v(row,"SECURITY_ISSUE_COUNT")).append("\n\n");
        }
        return new Artifact("Source scan summary", text.toString());
    }

    private Artifact codeReview(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Code Review Report");
        for (Map<String,Object> row : mapper.selectCodeIssues(id)) {
            text.append("## [").append(v(row,"SEVERITY")).append("] ").append(v(row,"SUMMARY")).append("\n\n")
                    .append("- Rule: ").append(v(row,"RULE_NAME")).append("\n- File: ").append(v(row,"FILE_PATH"))
                    .append("\n- Status: ").append(v(row,"STATUS")).append("\n\n").append(v(row,"DETAIL")).append("\n\n");
        }
        return new Artifact("Code review report", text.toString());
    }

    private Artifact securityReview(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Security Candidate Report");
        for (Map<String,Object> row : mapper.selectSecurityIssues(id)) {
            text.append("## [").append(v(row,"RISK_LEVEL")).append("] ").append(v(row,"TITLE")).append("\n\n")
                    .append("- Category: ").append(v(row,"CATEGORY")).append("\n- File: ").append(v(row,"FILE_PATH"))
                    .append("\n- Status: ").append(v(row,"STATUS")).append("\n\nEvidence: ").append(v(row,"EVIDENCE"))
                    .append("\n\nRecommendation: ").append(v(row,"RECOMMENDATION")).append("\n\n");
        }
        return new Artifact("Security review report", text.toString());
    }

    private Artifact standardReport(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Standard Term Review");
        text.append("| Source | Standard | Status | Recommendation | Excluded |\n")
                .append("|---|---|---|---|---|\n");
        for (Map<String,Object> row : mapper.selectStandardTerms(id)) {
            text.append('|').append(v(row,"SOURCE_WORD")).append('|').append(v(row,"STANDARD_WORD"))
                    .append('|').append(v(row,"MATCH_STATUS")).append('|').append(v(row,"RECOMMENDATION"))
                    .append('|').append(v(row,"EXCLUDED")).append("|\n");
        }
        return new Artifact("Standard term review", text.toString());
    }

    private Artifact standardCsv(Long id, ProjectVO project) {
        StringBuilder csv = new StringBuilder("\uFEFFSource,Standard,Status,Recommendation,Review memo,Excluded\r\n");
        for (Map<String,Object> row : mapper.selectStandardTerms(id)) {
            csv.append(csv(v(row,"SOURCE_WORD"))).append(',')
                    .append(csv(v(row,"STANDARD_WORD"))).append(',')
                    .append(csv(v(row,"MATCH_STATUS"))).append(',')
                    .append(csv(v(row,"RECOMMENDATION"))).append(',')
                    .append(csv(v(row,"REVIEW_MEMO"))).append(',')
                    .append(csv(v(row,"EXCLUDED"))).append("\r\n");
        }
        return new Artifact(project.getName() + " standard terms", csv.toString());
    }

    private Artifact dbDdl(Long id, ProjectVO project) {
        StringBuilder text = new StringBuilder("-- ").append(project.getName()).append(" DB model\n\n");
        List<Map<String,Object>> tables = mapper.selectDbTables(id);
        List<Map<String,Object>> columns = mapper.selectDbColumns(id);
        for (Map<String,Object> table : tables) {
            text.append("CREATE TABLE ").append(v(table,"NAME")).append(" (\n");
            List<Map<String,Object>> own = columns.stream()
                    .filter(column -> n(column,"DB_TABLE_ID") == n(table,"ID")).toList();
            for (int index = 0; index < own.size(); index++) {
                Map<String,Object> column = own.get(index);
                text.append("  ").append(v(column,"NAME")).append(' ').append(v(column,"DATA_TYPE"));
                if ("N".equals(v(column,"NULLABLE"))) text.append(" NOT NULL");
                if ("Y".equals(v(column,"IS_PRIMARY"))) text.append(" PRIMARY KEY");
                if ("Y".equals(v(column,"IS_UNIQUE"))) text.append(" UNIQUE");
                if (!v(column,"DEFAULT_VALUE").isBlank()) text.append(" DEFAULT ").append(v(column,"DEFAULT_VALUE"));
                text.append(index + 1 < own.size() ? ",\n" : "\n");
            }
            text.append(");\n\n");
        }
        return new Artifact("Database DDL draft", text.toString());
    }

    private Artifact openApi(Long id, ProjectVO project) {
        StringBuilder text = new StringBuilder("{\n  \"openapi\":\"3.0.3\",\n  \"info\":{\"title\":\"")
                .append(json(project.getName())).append("\",\"version\":\"1.0.0\"},\n  \"paths\":{");
        List<Map<String,Object>> endpoints = mapper.selectApiEndpoints(id);
        for (int i = 0; i < endpoints.size(); i++) {
            Map<String,Object> endpoint = endpoints.get(i);
            if (i > 0) text.append(',');
            text.append("\n    \"").append(json(v(endpoint,"PATH"))).append("\":{\"")
                    .append(v(endpoint,"METHOD").toLowerCase(Locale.ROOT)).append("\":{\"summary\":\"")
                    .append(json(v(endpoint,"SUMMARY"))).append("\",\"responses\":{\"")
                    .append(v(endpoint,"STATUS_CODE")).append("\":{\"description\":\"Response\"}}}}");
        }
        text.append("\n  }\n}\n");
        return new Artifact("OpenAPI draft", text.toString());
    }

    private Artifact diagram(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Diagram Definitions");
        for (Map<String,Object> row : mapper.selectDiagrams(id)) {
            text.append("## ").append(v(row,"NAME")).append(" · ").append(v(row,"DIAGRAM_TYPE"))
                    .append("\n\n```json\n").append(v(row,"PAYLOAD_JSON")).append("\n```\n\n");
        }
        return new Artifact("Diagram definitions", text.toString());
    }

    private Artifact apiTest(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "API Test Report");
        List<Map<String,Object>> results = mapper.selectApiTestResults(id);
        for (Map<String,Object> test : mapper.selectApiTestCases(id)) {
            text.append("## ").append(v(test,"NAME")).append("\n\n- Endpoint: ")
                    .append(v(test,"METHOD")).append(' ').append(v(test,"PATH"))
                    .append("\n- Expected: ").append(v(test,"EXPECTED_STATUS_CODE"))
                    .append("\n- Auth: ").append(v(test,"AUTH_NAME")).append("\n\n");
            results.stream().filter(result -> v(result,"TEST_NAME").equals(v(test,"NAME"))).forEach(result ->
                    text.append("  - ").append(v(result,"RESULT_STATUS")).append(" · HTTP ")
                            .append(v(result,"STATUS_CODE")).append(" · ").append(v(result,"MESSAGE")).append("\n"));
            text.append('\n');
        }
        return new Artifact("API test report", text.toString());
    }

    private Artifact wiki(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "Wiki Document");
        for (Map<String,Object> page : mapper.selectWikiPages(id)) {
            text.append("## ").append(v(page,"TITLE")).append("\n\n").append(v(page,"CONTENT")).append("\n\n");
        }
        return new Artifact("Wiki document", text.toString());
    }

    private Artifact wbs(Long id, ProjectVO project) {
        StringBuilder text = heading(project, "WBS Document");
        for (Map<String,Object> item : mapper.selectWbsItems(id)) {
            text.append("- [").append("DONE".equals(v(item,"STATUS")) ? "x" : " ").append("] ")
                    .append(v(item,"TITLE")).append(" · ").append(v(item,"STATUS")).append(" · ")
                    .append(v(item,"PROGRESS")).append("% · ").append(v(item,"ASSIGNEE_NAME")).append("\n");
        }
        return new Artifact("WBS document", text.toString());
    }

    private StringBuilder heading(ProjectVO project, String title) {
        return new StringBuilder("# ").append(title).append("\n\nProject: ").append(project.getName()).append("\n\n");
    }
    private String v(Map<String,Object> row, String key) { return row.get(key) == null ? "" : String.valueOf(row.get(key)); }
    private long n(Map<String,Object> row, String key) { return row.get(key) == null ? -1 : ((Number)row.get(key)).longValue(); }
    private String json(String value) { return value == null ? "" : value.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n"); }
    private String csv(String value) {
        String safe = value == null ? "" : value;
        if (!safe.isEmpty() && "=+-@".indexOf(safe.charAt(0)) >= 0) safe = "'" + safe;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
    private record Artifact(String name, String content) {}
    public record Download(String filename, String mimeType, byte[] content) {}
}
