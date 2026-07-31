package com.aastudio.domain.workbench;

import com.aastudio.mapper.WorkbenchMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkbenchService {
    private final WorkbenchMapper mapper;
    private final ObjectMapper objectMapper;

    public Map<String, Object> load(Long projectId) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("summary", mapper.selectSummary(projectId));
        view.put("scans", mapper.selectScans(projectId));
        view.put("projectWorkspaces", mapper.selectProjectWorkspaces(projectId));
        view.put("projectDashboard", mapper.selectProjectDashboard(projectId));
        view.put("codeIssues", mapper.selectCodeIssues(projectId));
        view.put("securityIssues", mapper.selectSecurityIssues(projectId));
        view.put("securityScans", mapper.selectSecurityScans(projectId));
        view.put("securityExternalResults", mapper.selectSecurityExternalResults(projectId));
        view.put("dbModels", mapper.selectDbModels(projectId));
        view.put("dbTables", mapper.selectDbTables(projectId));
        view.put("dbColumns", mapper.selectDbColumns(projectId));
        view.put("dbRelations", mapper.selectDbRelations(projectId));
        view.put("dbChangeHistory", mapper.selectDbChangeHistory(projectId));
        view.put("diagrams", mapper.selectDiagrams(projectId));
        view.put("apiEndpoints", mapper.selectApiEndpoints(projectId));
        view.put("apiGroups", mapper.selectApiGroups(projectId));
        view.put("apiSchemas", mapper.selectApiSchemas(projectId));
        view.put("apiAuthProfiles", mapper.selectApiAuthProfiles(projectId));
        view.put("sampleDatasets", mapper.selectSampleDatasets(projectId));
        view.put("sampleDatasetItems", mapper.selectSampleDatasetItems(projectId));
        view.put("apiTestCases", mapper.selectApiTestCases(projectId));
        view.put("apiTestResults", mapper.selectApiTestResults(projectId));
        view.put("wikiPages", mapper.selectWikiPages(projectId));
        view.put("wikiVersions", mapper.selectAllWikiVersions(projectId));
        view.put("wbsItems", mapper.selectWbsItems(projectId));
        view.put("wbsNotes", mapper.selectWbsNotes(projectId));
        view.put("wbsArtifactLinks", mapper.selectWbsArtifactLinks(projectId));
        view.put("stageAssignments", mapper.selectStageAssignments(projectId));
        view.put("stageHistory", mapper.selectStageHistory(projectId));
        view.put("accessLogs", mapper.selectAccessLogs(projectId));
        view.put("artifacts", mapper.selectArtifacts(projectId));
        view.put("standardTerms", mapper.selectStandardTerms(projectId));
        view.put("attachments", mapper.selectAttachments(projectId));
        view.put("shareTokens", mapper.selectShareTokens(projectId));
        return view;
    }

    public Map<String, Object> getWikiPage(Long projectId, Long wikiPageId) {
        return wikiPageId == null ? null : mapper.selectWikiPage(projectId, wikiPageId);
    }

    public java.util.List<Map<String, Object>> getWikiVersions(Long projectId, Long wikiPageId) {
        return wikiPageId == null ? java.util.List.of() : mapper.selectWikiVersions(projectId, wikiPageId);
    }

    public void addScan(Long projectId, String scanPath, String language, String framework) {
        mapper.insertScan(projectId, required(scanPath, "스캔 경로"), trim(language), trim(framework));
    }
    public void addProjectWorkspace(Long projectId, String workspaceName, String workspaceType) {
        mapper.insertProjectWorkspace(projectId, required(workspaceName, "작업영역명"), required(workspaceType, "작업영역 유형"));
    }
    @Transactional
    public void saveDashboardSummary(Long projectId, String summary) {
        String value = trim(summary);
        if (mapper.updateProjectDashboard(projectId, value) == 0) {
            mapper.insertProjectDashboard(projectId, value);
        }
    }
    public void addCodeIssue(Long projectId, String filePath, String ruleName, String severity, String summary, String detail) {
        mapper.insertCodeIssue(projectId, trim(filePath), required(ruleName, "규칙명"),
                required(severity, "심각도"), required(summary, "요약"), trim(detail));
    }
    public void reviewCodeIssue(Long projectId, Long issueId, String status, String reviewNote) {
        mapper.updateCodeIssueReview(projectId, issueId, reviewStatus(status), trim(reviewNote));
    }
    public void addSecurityIssue(Long projectId, String category, String title, String description,
                                 String filePath, String riskLevel, String evidence, String recommendation) {
        mapper.insertSecurityIssue(projectId, required(category, "분류"), required(title, "제목"),
                trim(description), trim(filePath), required(riskLevel, "위험도"), trim(evidence), trim(recommendation));
    }
    public void reviewSecurityIssue(Long projectId, Long issueId, String status, String reviewNote) {
        mapper.updateSecurityIssueReview(projectId, issueId, reviewStatus(status), trim(reviewNote));
    }
    public void addSecurityScan(Long projectId, Long sourceScanId, String scanType, String policyName) {
        mapper.insertSecurityScan(projectId, sourceScanId, required(scanType, "점검 유형"), required(policyName, "정책명"));
    }
    public void addSecurityExternalResult(Long projectId, String toolName, String summaryText, String payloadJson) {
        mapper.insertSecurityExternalResult(projectId, required(toolName, "도구명"), trim(summaryText),
                validateJson(payloadJson, "외부 보안 결과"));
    }
    public void addStandardTerm(Long projectId, String sourceWord, String standardWord, String matchStatus,
                                String recommendation, String reviewMemo) {
        mapper.insertStandardTerm(projectId, required(sourceWord, "추출 단어"), trim(standardWord),
                required(matchStatus, "매칭 상태"), trim(recommendation), trim(reviewMemo));
    }
    public void updateStandardTerm(Long projectId, Long termId, String standardWord, String matchStatus,
                                   String recommendation, String reviewMemo, String excluded) {
        mapper.updateStandardTerm(projectId, termId, trim(standardWord), required(matchStatus, "매칭 상태"),
                trim(recommendation), trim(reviewMemo), "Y".equalsIgnoreCase(excluded) ? "Y" : "N");
    }
    @Transactional
    public void bulkUpdateStandardTerms(Long projectId, java.util.List<Long> termIds,
                                        String matchStatus, String excludedMode) {
        if (termIds == null || termIds.isEmpty()) throw new IllegalArgumentException("변경할 표준단어를 선택하세요.");
        String status = required(matchStatus, "매칭 상태");
        for (Long termId : termIds) {
            Map<String, Object> term = mapper.selectStandardTerm(projectId, termId);
            if (term == null) throw new IllegalArgumentException("프로젝트에 속하지 않은 표준단어가 포함되어 있습니다.");
            String excluded = switch (excludedMode == null ? "KEEP" : excludedMode) {
                case "EXCLUDE" -> "Y";
                case "INCLUDE" -> "N";
                default -> String.valueOf(term.get("EXCLUDED"));
            };
            mapper.updateStandardTerm(projectId, termId, value(term, "STANDARD_WORD"), status,
                    value(term, "RECOMMENDATION"), value(term, "REVIEW_MEMO"), excluded);
        }
    }
    @Transactional
    public void addDbModel(Long projectId, String name, String description, String ddlText) {
        String modelName = required(name, "모델명");
        mapper.insertDbModel(projectId, modelName, trim(description), trim(ddlText));
        mapper.insertDbChange(projectId, "MODEL", modelName, "CREATE", trim(description));
    }
    @Transactional
    public void addDbTable(Long projectId, Long modelId, String name, String description, String primaryKeyName) {
        String tableName = required(name, "테이블명");
        mapper.insertDbTable(projectId, modelId, tableName, trim(description), trim(primaryKeyName));
        mapper.insertDbChange(projectId, "TABLE", tableName, "CREATE", trim(description));
    }
    @Transactional
    public void addDbColumn(Long projectId, Long tableId, String name, String dataType, String nullable,
                            String defaultValue, String isPrimary, String isUnique, String isIndexed, String description) {
        mapper.insertDbColumn(projectId, tableId, required(name, "컬럼명"), required(dataType, "데이터 타입"),
                flag(nullable, "Y"), trim(defaultValue), flag(isPrimary, "N"), flag(isUnique, "N"),
                flag(isIndexed, "N"), trim(description));
        mapper.insertDbChange(projectId, "COLUMN", required(name, "컬럼명"), "CREATE",
                required(dataType, "데이터 타입") + " · nullable " + flag(nullable, "Y"));
    }
    @Transactional
    public void addDbRelation(Long projectId, Long modelId, Long fromTableId, Long toTableId, String relationType,
                              String fromColumn, String toColumn, String description) {
        mapper.insertDbRelation(projectId, modelId, fromTableId, toTableId, required(relationType, "관계 유형"),
                required(fromColumn, "원본 컬럼"), required(toColumn, "대상 컬럼"), trim(description));
        mapper.insertDbChange(projectId, "RELATION", required(fromColumn, "원본 컬럼") + " → " +
                required(toColumn, "대상 컬럼"), "CREATE", required(relationType, "관계 유형"));
    }
    public void addDiagram(Long projectId, String name, String diagramType, String payloadJson) {
        String payload = trim(payloadJson);
        if (payload.isBlank()) payload = "{\"nodes\":[],\"edges\":[]}";
        try {
            JsonNode root = objectMapper.readTree(payload);
            if (!root.isObject() || !root.path("nodes").isArray() || !root.path("edges").isArray()) {
                throw new IllegalArgumentException("다이어그램 JSON에는 nodes와 edges 배열이 필요합니다.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("유효한 다이어그램 JSON을 입력하세요.", e);
        }
        mapper.insertDiagram(projectId, required(name, "다이어그램명"), required(diagramType, "유형"), payload);
    }
    public void addApi(Long projectId, String method, String path, String summary) {
        addApi(projectId, method, path, summary, null, null, null, "N", 200);
    }
    public void addApi(Long projectId, String method, String path, String summary, Long apiGroupId,
                       Long requestSchemaId, Long responseSchemaId, String authRequired, Integer statusCode) {
        mapper.insertApiEndpoint(projectId, required(method, "HTTP method").toUpperCase(Locale.ROOT),
                required(path, "API 경로"), trim(summary), apiGroupId, requestSchemaId, responseSchemaId,
                flag(authRequired, "N"), statusCode == null ? 200 : statusCode);
    }
    public void addApiGroup(Long projectId, String name, String description) {
        mapper.insertApiGroup(projectId, required(name, "API 그룹명"), trim(description));
    }
    public void addApiSchema(Long projectId, String name, String schemaType, String payloadJson) {
        String payload = validateJson(payloadJson, "API 스키마");
        mapper.insertApiSchema(projectId, required(name, "스키마명"), required(schemaType, "스키마 유형"), payload);
    }
    public void addApiAuthProfile(Long projectId, String name, String authType, String configJson, String isDefault) {
        mapper.insertApiAuthProfile(projectId, required(name, "인증 프로필명"), required(authType, "인증 유형"),
                trim(configJson), "Y".equalsIgnoreCase(isDefault) ? "Y" : "N");
    }
    public void addSampleDataset(Long projectId, String name, String description, String payloadJson, String isShared) {
        mapper.insertSampleDataset(projectId, required(name, "샘플 데이터명"), trim(description), trim(payloadJson),
                "Y".equalsIgnoreCase(isShared) ? "Y" : "N");
    }
    public void addSampleDatasetItem(Long projectId, Long datasetId, String itemKey, String itemValueJson) {
        mapper.insertSampleDatasetItem(projectId, datasetId, required(itemKey, "항목 키"),
                validateJson(itemValueJson, "샘플 데이터 항목"));
    }
    public void addApiTestCase(Long projectId, Long endpointId, Long authProfileId, String name, String requestJson,
                               Integer expectedStatusCode, String expectedResponseJson, Long sampleDatasetId) {
        mapper.insertApiTestCase(projectId, endpointId, authProfileId, required(name, "테스트명"), trim(requestJson),
                expectedStatusCode == null ? 200 : expectedStatusCode, trim(expectedResponseJson), sampleDatasetId);
    }

    @Transactional
    public void addWiki(Long projectId, String title, String content, String tags, String actor) {
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("projectId", projectId);
        page.put("title", required(title, "Wiki 제목"));
        page.put("slug", slug(title));
        page.put("content", trim(content));
        page.put("tags", trim(tags));
        page.put("createdBy", actor);
        mapper.insertWikiPage(page);
        mapper.insertWikiVersion(((Number) page.get("id")).longValue(), trim(content), "최초 작성", actor);
    }
    public void addWbs(Long projectId, String title, String description, String priority) {
        addWbs(projectId, title, description, priority, null, "", "");
    }
    public void addWbs(Long projectId, String title, String description, String priority,
                       Long parentId, String assigneeName, String dueDate) {
        mapper.insertWbsItem(projectId, required(title, "WBS 제목"), trim(description),
                priority == null || priority.isBlank() ? "MEDIUM" : priority,
                parentId, trim(assigneeName), trim(dueDate));
    }
    @Transactional
    public void updateWiki(Long projectId, Long wikiPageId, String title, String content, String tags,
                           String changeNote, String actor) {
        if (mapper.selectWikiPage(projectId, wikiPageId) == null) throw new IllegalArgumentException("Wiki 페이지를 찾을 수 없습니다.");
        mapper.updateWikiPage(projectId, wikiPageId, required(title, "Wiki 제목"), trim(content), trim(tags));
        mapper.insertWikiVersion(wikiPageId, trim(content), trim(changeNote), actor);
    }
    @Transactional
    public void restoreWiki(Long projectId, Long wikiPageId, Long versionId, String actor) {
        Map<String, Object> page = mapper.selectWikiPage(projectId, wikiPageId);
        Map<String, Object> version = mapper.selectWikiVersion(projectId, versionId);
        if (page == null || version == null || !wikiPageId.equals(((Number) version.get("WIKI_PAGE_ID")).longValue())) {
            throw new IllegalArgumentException("복원할 Wiki 버전을 찾을 수 없습니다.");
        }
        String content = String.valueOf(version.get("CONTENT_SNAPSHOT"));
        mapper.updateWikiPage(projectId, wikiPageId, String.valueOf(page.get("TITLE")), content, String.valueOf(page.get("TAGS")));
        mapper.insertWikiVersion(wikiPageId, content, "버전 " + version.get("VERSION_NO") + " 복원", actor);
    }
    public void deleteWiki(Long projectId, Long wikiPageId) {
        mapper.deleteWikiPage(projectId, wikiPageId);
    }
    public void updateWbs(Long projectId, Long wbsId, String status, Integer progress) {
        int safeProgress = Math.max(0, Math.min(100, progress == null ? 0 : progress));
        mapper.updateWbsItem(projectId, wbsId, required(status, "상태"), safeProgress);
    }
    public void deleteWbs(Long projectId, Long wbsId) {
        mapper.deleteWbsItem(projectId, wbsId);
    }
    public void addWbsNote(Long projectId, Long wbsId, String noteText, String actor) {
        if (mapper.selectWbsItem(projectId, wbsId) == null) throw new IllegalArgumentException("WBS 항목을 찾을 수 없습니다.");
        mapper.insertWbsNote(projectId, wbsId, required(noteText, "상태 메모"), actor);
    }
    public void linkWbsArtifact(Long projectId, Long wbsId, Long artifactId) {
        if (mapper.selectWbsItem(projectId, wbsId) == null || mapper.selectArtifact(projectId, artifactId) == null) {
            throw new IllegalArgumentException("같은 프로젝트의 WBS와 산출물만 연결할 수 있습니다.");
        }
        mapper.insertWbsArtifactLink(projectId, wbsId, artifactId);
    }
    @Transactional
    public void saveStage(Long projectId, Map<String, Object> assignment) {
        assignment.put("projectId", projectId);
        assignment.put("stageName", required((String) assignment.get("stageName"), "단계명"));
        if (assignment.get("status") == null || ((String) assignment.get("status")).isBlank()) assignment.put("status", "READY");
        Map<String, Object> previous = mapper.selectStageAssignment(projectId, (String) assignment.get("stageName"));
        String after = String.valueOf(assignment.get("status"));
        if (mapper.updateStageAssignment(assignment) == 0) {
            mapper.insertStageAssignment(assignment);
        }
        if ("IN_PROGRESS".equals(after)) mapper.updateProjectCurrentStage(projectId, (String) assignment.get("stageName"));
        String before = previous == null ? null : String.valueOf(previous.get("STATUS"));
        if (previous == null || !after.equals(before)) {
            Map<String, Object> history = new LinkedHashMap<>();
            history.put("projectId", projectId);
            history.put("stageName", assignment.get("stageName"));
            history.put("beforeStatus", before);
            history.put("afterStatus", after);
            history.put("changedBy", assignment.get("changedBy"));
            history.put("changeNote", assignment.get("changeNote"));
            mapper.insertStageHistory(history);
        }
    }
    private String required(String value, String label) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(label + "은(는) 필수입니다.");
        return value.trim();
    }
    private String trim(String value) { return value == null ? "" : value.trim(); }
    private String flag(String value, String fallback) { return value == null ? fallback : ("Y".equalsIgnoreCase(value) ? "Y" : "N"); }
    private String value(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value == null ? "" : String.valueOf(value);
    }
    private String validateJson(String value, String label) {
        String json = trim(value);
        if (json.isBlank()) return "{}";
        try { objectMapper.readTree(json); return json; }
        catch (Exception e) { throw new IllegalArgumentException(label + " JSON이 유효하지 않습니다.", e); }
    }
    private String reviewStatus(String value) {
        String status = required(value, "검토 상태").toUpperCase(Locale.ROOT);
        return switch (status) {
            case "OPEN", "CONFIRMED", "RESOLVED", "HOLD", "FALSE_POSITIVE" -> status;
            default -> throw new IllegalArgumentException("지원하지 않는 검토 상태입니다.");
        };
    }
    private String slug(String value) {
        String slug = Normalizer.normalize(required(value, "Wiki 제목"), Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", "-").replaceAll("(^-|-$)", "");
        return slug + "-" + System.currentTimeMillis();
    }
}
