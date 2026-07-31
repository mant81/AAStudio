package com.aastudio.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Param;

public interface WorkbenchMapper {
    Map<String, Object> selectSummary(Long projectId);
    List<Map<String, Object>> selectScans(Long projectId);
    Map<String, Object> selectScan(@Param("projectId") Long projectId, @Param("scanId") Long scanId);
    List<Map<String, Object>> selectProjectWorkspaces(Long projectId);
    Map<String, Object> selectProjectDashboard(Long projectId);
    List<Map<String, Object>> selectCodeIssues(Long projectId);
    Map<String, Object> selectCodeIssue(@Param("projectId") Long projectId, @Param("issueId") Long issueId);
    List<Map<String, Object>> selectSecurityIssues(Long projectId);
    List<Map<String, Object>> selectSecurityScans(Long projectId);
    List<Map<String, Object>> selectSecurityExternalResults(Long projectId);
    List<Map<String, Object>> selectDbModels(Long projectId);
    List<Map<String, Object>> selectDbTables(Long projectId);
    List<Map<String, Object>> selectDbColumns(Long projectId);
    List<Map<String, Object>> selectDbRelations(Long projectId);
    List<Map<String, Object>> selectDbChangeHistory(Long projectId);
    List<Map<String, Object>> selectDiagrams(Long projectId);
    List<Map<String, Object>> selectApiEndpoints(Long projectId);
    List<Map<String, Object>> selectApiGroups(Long projectId);
    List<Map<String, Object>> selectApiSchemas(Long projectId);
    List<Map<String, Object>> selectApiAuthProfiles(Long projectId);
    List<Map<String, Object>> selectSampleDatasets(Long projectId);
    List<Map<String, Object>> selectSampleDatasetItems(Long projectId);
    List<Map<String, Object>> selectApiTestCases(Long projectId);
    List<Map<String, Object>> selectApiTestResults(Long projectId);
    Map<String, Object> selectApiTestCaseForExecution(@Param("projectId") Long projectId,
                                                      @Param("testCaseId") Long testCaseId);
    List<Map<String, Object>> selectWikiPages(Long projectId);
    List<Map<String, Object>> selectWbsItems(Long projectId);
    Map<String, Object> selectWbsItem(@Param("projectId") Long projectId, @Param("wbsId") Long wbsId);
    List<Map<String, Object>> selectWbsNotes(Long projectId);
    List<Map<String, Object>> selectWbsArtifactLinks(Long projectId);
    List<Map<String, Object>> selectStageAssignments(Long projectId);
    List<Map<String, Object>> selectStageHistory(Long projectId);
    List<Map<String, Object>> selectAccessLogs(Long projectId);
    List<Map<String, Object>> selectArtifacts(Long projectId);
    Map<String, Object> selectArtifact(@Param("projectId") Long projectId, @Param("artifactId") Long artifactId);
    List<Map<String, Object>> selectStandardTerms(Long projectId);
    Map<String, Object> selectStandardTerm(@Param("projectId") Long projectId, @Param("termId") Long termId);
    List<Map<String, Object>> selectWikiVersions(@Param("projectId") Long projectId, @Param("wikiPageId") Long wikiPageId);
    List<Map<String, Object>> selectAllWikiVersions(Long projectId);
    Map<String, Object> selectWikiPage(@Param("projectId") Long projectId, @Param("wikiPageId") Long wikiPageId);
    Map<String, Object> selectWikiVersion(@Param("projectId") Long projectId, @Param("versionId") Long versionId);
    List<Map<String, Object>> selectAttachments(Long projectId);
    Map<String, Object> selectAttachment(@Param("projectId") Long projectId, @Param("attachmentId") Long attachmentId);
    List<Map<String, Object>> selectShareTokens(Long projectId);
    Map<String, Object> selectShareTokenByHash(String tokenHash);
    List<Map<String, Object>> selectShareAttachments(Long projectId);

    int insertScan(@Param("projectId") Long projectId, @Param("scanPath") String scanPath,
                   @Param("language") String language, @Param("framework") String framework);
    int updateScanResult(@Param("projectId") Long projectId, @Param("scanId") Long scanId,
                         @Param("status") String status, @Param("language") String language,
                         @Param("framework") String framework, @Param("fileCount") Integer fileCount,
                         @Param("codeIssueCount") Integer codeIssueCount,
                         @Param("securityIssueCount") Integer securityIssueCount);
    int insertAnalyzedCodeIssue(Map<String,Object> issue);
    int insertAnalyzedSecurityIssue(Map<String,Object> issue);
    int insertProjectWorkspace(@Param("projectId") Long projectId, @Param("workspaceName") String workspaceName,
                               @Param("workspaceType") String workspaceType);
    int updateProjectDashboard(@Param("projectId") Long projectId, @Param("summary") String summary);
    int insertProjectDashboard(@Param("projectId") Long projectId, @Param("summary") String summary);
    int insertCodeIssue(@Param("projectId") Long projectId, @Param("filePath") String filePath,
                        @Param("ruleName") String ruleName, @Param("severity") String severity,
                        @Param("summary") String summary, @Param("detail") String detail);
    int updateCodeIssueReview(@Param("projectId") Long projectId, @Param("issueId") Long issueId,
                              @Param("status") String status, @Param("reviewNote") String reviewNote);
    int updateCodeIssueLlmReview(@Param("projectId") Long projectId, @Param("issueId") Long issueId,
                                 @Param("explanation") String explanation, @Param("model") String model);
    int insertSecurityIssue(@Param("projectId") Long projectId, @Param("category") String category,
                            @Param("title") String title, @Param("description") String description,
                            @Param("filePath") String filePath, @Param("riskLevel") String riskLevel,
                            @Param("evidence") String evidence, @Param("recommendation") String recommendation);
    int updateSecurityIssueReview(@Param("projectId") Long projectId, @Param("issueId") Long issueId,
                                  @Param("status") String status, @Param("reviewNote") String reviewNote);
    int insertSecurityScan(@Param("projectId") Long projectId, @Param("sourceScanId") Long sourceScanId,
                           @Param("scanType") String scanType, @Param("policyName") String policyName);
    int insertSecurityExternalResult(@Param("projectId") Long projectId, @Param("toolName") String toolName,
                                     @Param("summaryText") String summaryText,
                                     @Param("payloadJson") String payloadJson);
    int insertStandardTerm(@Param("projectId") Long projectId, @Param("sourceWord") String sourceWord,
                           @Param("standardWord") String standardWord, @Param("matchStatus") String matchStatus,
                           @Param("recommendation") String recommendation, @Param("reviewMemo") String reviewMemo);
    int updateStandardTerm(@Param("projectId") Long projectId, @Param("termId") Long termId,
                           @Param("standardWord") String standardWord, @Param("matchStatus") String matchStatus,
                           @Param("recommendation") String recommendation, @Param("reviewMemo") String reviewMemo,
                           @Param("excluded") String excluded);
    int insertDbModel(@Param("projectId") Long projectId, @Param("name") String name,
                      @Param("description") String description, @Param("ddlText") String ddlText);
    int insertDbTable(@Param("projectId") Long projectId, @Param("modelId") Long modelId,
                      @Param("name") String name, @Param("description") String description,
                      @Param("primaryKeyName") String primaryKeyName);
    int insertDbColumn(@Param("projectId") Long projectId, @Param("tableId") Long tableId,
                       @Param("name") String name, @Param("dataType") String dataType,
                       @Param("nullable") String nullable, @Param("defaultValue") String defaultValue,
                       @Param("isPrimary") String isPrimary, @Param("isUnique") String isUnique,
                       @Param("isIndexed") String isIndexed, @Param("description") String description);
    int insertDbRelation(@Param("projectId") Long projectId, @Param("modelId") Long modelId,
                         @Param("fromTableId") Long fromTableId, @Param("toTableId") Long toTableId,
                         @Param("relationType") String relationType, @Param("fromColumn") String fromColumn,
                         @Param("toColumn") String toColumn, @Param("description") String description);
    int insertDbChange(@Param("projectId") Long projectId, @Param("entityType") String entityType,
                       @Param("entityName") String entityName, @Param("changeType") String changeType,
                       @Param("detailText") String detailText);
    int insertDiagram(@Param("projectId") Long projectId, @Param("name") String name,
                      @Param("diagramType") String diagramType, @Param("payloadJson") String payloadJson);
    int insertApiEndpoint(@Param("projectId") Long projectId, @Param("method") String method,
                          @Param("path") String path, @Param("summary") String summary,
                          @Param("apiGroupId") Long apiGroupId, @Param("requestSchemaId") Long requestSchemaId,
                          @Param("responseSchemaId") Long responseSchemaId, @Param("authRequired") String authRequired,
                          @Param("statusCode") Integer statusCode);
    int deleteSyncedApiEndpoints(Long projectId);
    int insertSyncedApiEndpoint(@Param("projectId") Long projectId, @Param("method") String method,
                                @Param("path") String path, @Param("summary") String summary);
    int insertApiGroup(@Param("projectId") Long projectId, @Param("name") String name,
                       @Param("description") String description);
    int insertApiSchema(@Param("projectId") Long projectId, @Param("name") String name,
                        @Param("schemaType") String schemaType, @Param("payloadJson") String payloadJson);
    int insertApiAuthProfile(@Param("projectId") Long projectId, @Param("name") String name,
                             @Param("authType") String authType, @Param("configJson") String configJson,
                             @Param("isDefault") String isDefault);
    int insertSampleDataset(@Param("projectId") Long projectId, @Param("name") String name,
                            @Param("description") String description, @Param("payloadJson") String payloadJson,
                            @Param("isShared") String isShared);
    int insertSampleDatasetItem(@Param("projectId") Long projectId, @Param("datasetId") Long datasetId,
                                @Param("itemKey") String itemKey, @Param("itemValueJson") String itemValueJson);
    int insertApiTestCase(@Param("projectId") Long projectId, @Param("endpointId") Long endpointId,
                          @Param("authProfileId") Long authProfileId, @Param("name") String name,
                          @Param("requestJson") String requestJson, @Param("expectedStatusCode") Integer expectedStatusCode,
                          @Param("expectedResponseJson") String expectedResponseJson, @Param("sampleDatasetId") Long sampleDatasetId);
    int insertApiTestResult(Map<String, Object> result);
    int insertWikiPage(Map<String, Object> page);
    int insertWikiVersion(@Param("wikiPageId") Long wikiPageId, @Param("content") String content,
                          @Param("changeNote") String changeNote, @Param("createdBy") String createdBy);
    int updateWikiPage(@Param("projectId") Long projectId, @Param("wikiPageId") Long wikiPageId,
                       @Param("title") String title, @Param("content") String content, @Param("tags") String tags);
    int deleteWikiPage(@Param("projectId") Long projectId, @Param("wikiPageId") Long wikiPageId);
    int insertWbsItem(@Param("projectId") Long projectId, @Param("title") String title,
                      @Param("description") String description, @Param("priority") String priority,
                      @Param("parentId") Long parentId, @Param("assigneeName") String assigneeName,
                      @Param("dueDate") String dueDate);
    int updateWbsItem(@Param("projectId") Long projectId, @Param("wbsId") Long wbsId,
                      @Param("status") String status, @Param("progress") Integer progress);
    int deleteWbsItem(@Param("projectId") Long projectId, @Param("wbsId") Long wbsId);
    int insertWbsNote(@Param("projectId") Long projectId, @Param("wbsId") Long wbsId,
                      @Param("noteText") String noteText, @Param("createdBy") String createdBy);
    int insertWbsArtifactLink(@Param("projectId") Long projectId, @Param("wbsId") Long wbsId,
                              @Param("artifactId") Long artifactId);
    Map<String, Object> selectStageAssignment(@Param("projectId") Long projectId, @Param("stageName") String stageName);
    int updateStageAssignment(Map<String, Object> assignment);
    int insertStageAssignment(Map<String, Object> assignment);
    int insertStageHistory(Map<String, Object> history);
    int updateProjectCurrentStage(@Param("projectId") Long projectId, @Param("stageName") String stageName);
    int insertAccessLog(@Param("projectId") Long projectId, @Param("actor") String actor,
                        @Param("action") String action, @Param("targetType") String targetType,
                        @Param("targetId") String targetId, @Param("ipAddress") String ipAddress);
    int insertArtifact(@Param("projectId") Long projectId, @Param("artifactType") String artifactType,
                       @Param("name") String name, @Param("contentText") String contentText,
                       @Param("createdBy") String createdBy);
    int insertAttachment(Map<String, Object> attachment);
    int deleteAttachment(@Param("projectId") Long projectId, @Param("attachmentId") Long attachmentId);
    int insertShareToken(Map<String, Object> token);
    int revokeShareToken(@Param("projectId") Long projectId, @Param("shareId") Long shareId);
}
