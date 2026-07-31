package com.aastudio.domain.workbench;

import com.aastudio.domain.project.ProjectService;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;

@Controller
@RequiredArgsConstructor
public class WorkbenchController {
    private final ProjectService projectService;
    private final WorkbenchService workbenchService;
    private final SourceAnalysisService sourceAnalysisService;
    private final ArtifactService artifactService;
    private final AttachmentService attachmentService;
    private final ApiTestExecutionService apiTestExecutionService;
    private final LocalLlmReviewService localLlmReviewService;
    private final ApiSourceSyncService apiSourceSyncService;

    @GetMapping("/projects/{projectId}/workbench")
    public String workbench(@PathVariable Long projectId, @RequestParam(defaultValue = "dashboard") String tab,
                            @RequestParam(required=false) Long wikiId, Model model) {
        model.addAttribute("project", projectService.getProject(projectId));
        model.addAttribute("tab", tab);
        model.addAttribute("tabArtifactType", artifactTypeFor(tab));
        model.addAttribute("analysisRoot", sourceAnalysisService.allowedRoot().toString());
        workbenchService.load(projectId).forEach(model::addAttribute);
        if ("wiki".equals(tab)) {
            @SuppressWarnings("unchecked")
            java.util.List<Map<String,Object>> pages = (java.util.List<Map<String,Object>>) model.getAttribute("wikiPages");
            Long selectedId = wikiId;
            if (selectedId == null && pages != null && !pages.isEmpty()) {
                selectedId = ((Number) pages.get(0).get("ID")).longValue();
            }
            model.addAttribute("selectedWiki", workbenchService.getWikiPage(projectId, selectedId));
            model.addAttribute("selectedWikiVersions", workbenchService.getWikiVersions(projectId, selectedId));
        }
        return "workbench/index";
    }
    @PostMapping("/projects/{id}/workbench/scans")
    public String scan(@PathVariable Long id, @RequestParam String scanPath, @RequestParam(required=false) String language, @RequestParam(required=false) String framework) {
        workbenchService.addScan(id, scanPath, language, framework); return redirect(id, "scan");
    }
    @PostMapping("/projects/{id}/workbench/scans/{scanId}/analyze")
    public String analyze(@PathVariable Long id, @PathVariable Long scanId) {
        sourceAnalysisService.analyze(id, scanId); return redirect(id, "review");
    }
    @PostMapping("/projects/{id}/workbench/workspaces")
    public String workspace(@PathVariable Long id, @RequestParam String workspaceName, @RequestParam String workspaceType) {
        workbenchService.addProjectWorkspace(id, workspaceName, workspaceType); return redirect(id, "dashboard");
    }
    @PostMapping("/projects/{id}/workbench/dashboard")
    public String dashboard(@PathVariable Long id, @RequestParam(required=false) String summary) {
        workbenchService.saveDashboardSummary(id, summary); return redirect(id, "dashboard");
    }
    @PostMapping("/projects/{id}/workbench/code-issues")
    public String codeIssue(@PathVariable Long id, @RequestParam String filePath, @RequestParam String ruleName,
                            @RequestParam String severity, @RequestParam String summary,
                            @RequestParam(required=false) String detail) {
        workbenchService.addCodeIssue(id, filePath, ruleName, severity, summary, detail);
        return redirect(id, "review");
    }
    @PostMapping("/projects/{id}/workbench/code-issues/{issueId}/review")
    public String reviewCodeIssue(@PathVariable Long id, @PathVariable Long issueId,
                                  @RequestParam String status, @RequestParam(required=false) String reviewNote) {
        workbenchService.reviewCodeIssue(id, issueId, status, reviewNote); return redirect(id, "review");
    }
    @PostMapping("/projects/{id}/workbench/code-issues/{issueId}/explain")
    public String explainCodeIssue(@PathVariable Long id, @PathVariable Long issueId) {
        localLlmReviewService.explain(id, issueId);
        return redirect(id, "review");
    }
    @PostMapping("/projects/{id}/workbench/security-issues")
    public String securityIssue(@PathVariable Long id, @RequestParam String category, @RequestParam String title,
                                @RequestParam(required=false) String description, @RequestParam(required=false) String filePath,
                                @RequestParam String riskLevel, @RequestParam(required=false) String evidence,
                                @RequestParam(required=false) String recommendation) {
        workbenchService.addSecurityIssue(id, category, title, description, filePath, riskLevel, evidence, recommendation);
        return redirect(id, "security");
    }
    @PostMapping("/projects/{id}/workbench/security-issues/{issueId}/review")
    public String reviewSecurityIssue(@PathVariable Long id, @PathVariable Long issueId,
                                      @RequestParam String status, @RequestParam(required=false) String reviewNote) {
        workbenchService.reviewSecurityIssue(id, issueId, status, reviewNote); return redirect(id, "security");
    }
    @PostMapping("/projects/{id}/workbench/security-scans")
    public String securityScan(@PathVariable Long id, @RequestParam(required=false) Long sourceScanId,
                               @RequestParam String scanType, @RequestParam String policyName) {
        workbenchService.addSecurityScan(id, sourceScanId, scanType, policyName); return redirect(id, "security");
    }
    @PostMapping("/projects/{id}/workbench/security-external-results")
    public String securityExternalResult(@PathVariable Long id, @RequestParam String toolName,
                                         @RequestParam(required=false) String summaryText,
                                         @RequestParam String payloadJson) {
        workbenchService.addSecurityExternalResult(id, toolName, summaryText, payloadJson);
        return redirect(id, "security");
    }
    @PostMapping("/projects/{id}/workbench/standard-terms")
    public String standardTerm(@PathVariable Long id, @RequestParam String sourceWord,
                               @RequestParam(required=false) String standardWord, @RequestParam String matchStatus,
                               @RequestParam(required=false) String recommendation,
                               @RequestParam(required=false) String reviewMemo) {
        workbenchService.addStandardTerm(id, sourceWord, standardWord, matchStatus, recommendation, reviewMemo);
        return redirect(id, "standard");
    }
    @PostMapping("/projects/{id}/workbench/standard-terms/{termId}")
    public String updateStandardTerm(@PathVariable Long id, @PathVariable Long termId,
                                     @RequestParam(required=false) String standardWord, @RequestParam String matchStatus,
                                     @RequestParam(required=false) String recommendation,
                                     @RequestParam(required=false) String reviewMemo,
                                     @RequestParam(required=false) String excluded) {
        workbenchService.updateStandardTerm(id, termId, standardWord, matchStatus, recommendation, reviewMemo, excluded);
        return redirect(id, "standard");
    }
    @PostMapping("/projects/{id}/workbench/standard-terms/bulk")
    public String bulkUpdateStandardTerms(@PathVariable Long id, @RequestParam java.util.List<Long> termIds,
                                          @RequestParam String matchStatus,
                                          @RequestParam(defaultValue="KEEP") String excludedMode) {
        workbenchService.bulkUpdateStandardTerms(id, termIds, matchStatus, excludedMode);
        return redirect(id, "standard");
    }
    @PostMapping("/projects/{id}/workbench/db-models")
    public String dbModel(@PathVariable Long id, @RequestParam String name, @RequestParam(required=false) String description, @RequestParam(required=false) String ddlText) {
        workbenchService.addDbModel(id, name, description, ddlText); return redirect(id, "database");
    }
    @PostMapping("/projects/{id}/workbench/db-tables")
    public String dbTable(@PathVariable Long id, @RequestParam Long modelId, @RequestParam String name,
                          @RequestParam(required=false) String description,
                          @RequestParam(required=false) String primaryKeyName) {
        workbenchService.addDbTable(id, modelId, name, description, primaryKeyName); return redirect(id, "database");
    }
    @PostMapping("/projects/{id}/workbench/db-columns")
    public String dbColumn(@PathVariable Long id, @RequestParam Long tableId, @RequestParam String name,
                           @RequestParam String dataType, @RequestParam(required=false) String nullable,
                           @RequestParam(required=false) String defaultValue, @RequestParam(required=false) String isPrimary,
                           @RequestParam(required=false) String isUnique, @RequestParam(required=false) String isIndexed,
                           @RequestParam(required=false) String description) {
        workbenchService.addDbColumn(id, tableId, name, dataType, nullable, defaultValue, isPrimary, isUnique, isIndexed, description);
        return redirect(id, "database");
    }
    @PostMapping("/projects/{id}/workbench/db-relations")
    public String dbRelation(@PathVariable Long id, @RequestParam Long modelId, @RequestParam Long fromTableId,
                             @RequestParam Long toTableId, @RequestParam String relationType,
                             @RequestParam String fromColumn, @RequestParam String toColumn,
                             @RequestParam(required=false) String description) {
        workbenchService.addDbRelation(id, modelId, fromTableId, toTableId, relationType, fromColumn, toColumn, description);
        return redirect(id, "database");
    }
    @PostMapping("/projects/{id}/workbench/diagrams")
    public String diagram(@PathVariable Long id, @RequestParam String name, @RequestParam String diagramType, @RequestParam(required=false) String payloadJson) {
        workbenchService.addDiagram(id, name, diagramType, payloadJson); return redirect(id, "diagram");
    }
    @PostMapping("/projects/{id}/workbench/apis")
    public String api(@PathVariable Long id, @RequestParam String method, @RequestParam String path,
                      @RequestParam(required=false) String summary, @RequestParam(required=false) Long apiGroupId,
                      @RequestParam(required=false) Long requestSchemaId,
                      @RequestParam(required=false) Long responseSchemaId,
                      @RequestParam(required=false) String authRequired,
                      @RequestParam(required=false) Integer statusCode) {
        workbenchService.addApi(id, method, path, summary, apiGroupId, requestSchemaId, responseSchemaId,
                authRequired, statusCode);
        return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/apis/sync")
    public String syncApis(@PathVariable Long id, @RequestParam Long scanId) {
        apiSourceSyncService.synchronize(id, scanId);
        return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/api-groups")
    public String apiGroup(@PathVariable Long id, @RequestParam String name, @RequestParam(required=false) String description) {
        workbenchService.addApiGroup(id, name, description); return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/api-schemas")
    public String apiSchema(@PathVariable Long id, @RequestParam String name, @RequestParam String schemaType,
                            @RequestParam(required=false) String payloadJson) {
        workbenchService.addApiSchema(id, name, schemaType, payloadJson); return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/api-auth")
    public String apiAuth(@PathVariable Long id, @RequestParam String name, @RequestParam String authType,
                          @RequestParam(required=false) String configJson, @RequestParam(required=false) String isDefault) {
        workbenchService.addApiAuthProfile(id, name, authType, configJson, isDefault); return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/sample-datasets")
    public String sampleDataset(@PathVariable Long id, @RequestParam String name,
                                @RequestParam(required=false) String description,
                                @RequestParam(required=false) String payloadJson,
                                @RequestParam(required=false) String isShared) {
        workbenchService.addSampleDataset(id, name, description, payloadJson, isShared); return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/sample-dataset-items")
    public String sampleDatasetItem(@PathVariable Long id, @RequestParam Long datasetId,
                                    @RequestParam String itemKey, @RequestParam String itemValueJson) {
        workbenchService.addSampleDatasetItem(id, datasetId, itemKey, itemValueJson); return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/api-tests")
    public String apiTest(@PathVariable Long id, @RequestParam Long endpointId,
                          @RequestParam(required=false) Long authProfileId, @RequestParam String name,
                          @RequestParam(required=false) String requestJson,
                          @RequestParam(required=false) Integer expectedStatusCode,
                          @RequestParam(required=false) String expectedResponseJson,
                          @RequestParam(required=false) Long sampleDatasetId) {
        workbenchService.addApiTestCase(id, endpointId, authProfileId, name, requestJson,
                expectedStatusCode, expectedResponseJson, sampleDatasetId);
        return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/api-tests/{testCaseId}/execute")
    public String executeApiTest(@PathVariable Long id, @PathVariable Long testCaseId,
                                 @RequestParam String baseUrl) {
        apiTestExecutionService.execute(id, testCaseId, baseUrl);
        return redirect(id, "api");
    }
    @PostMapping("/projects/{id}/workbench/wiki")
    public String wiki(@PathVariable Long id, @RequestParam String title, @RequestParam(required=false) String content, @RequestParam(required=false) String tags, Principal principal) {
        workbenchService.addWiki(id, title, content, tags, principal.getName()); return redirect(id, "wiki");
    }
    @PostMapping("/projects/{id}/workbench/wiki/{wikiPageId}")
    public String updateWiki(@PathVariable Long id, @PathVariable Long wikiPageId, @RequestParam String title,
                             @RequestParam(required=false) String content, @RequestParam(required=false) String tags,
                             @RequestParam(required=false) String changeNote, Principal principal) {
        workbenchService.updateWiki(id, wikiPageId, title, content, tags, changeNote, principal.getName());
        return redirect(id, "wiki");
    }
    @PostMapping("/projects/{id}/workbench/wiki/{wikiPageId}/restore/{versionId}")
    public String restoreWiki(@PathVariable Long id, @PathVariable Long wikiPageId, @PathVariable Long versionId,
                              Principal principal) {
        workbenchService.restoreWiki(id, wikiPageId, versionId, principal.getName());
        return redirect(id, "wiki");
    }
    @PostMapping("/projects/{id}/workbench/wbs")
    public String wbs(@PathVariable Long id, @RequestParam String title, @RequestParam(required=false) String description,
                      @RequestParam(required=false) String priority, @RequestParam(required=false) Long parentId,
                      @RequestParam(required=false) String assigneeName, @RequestParam(required=false) String dueDate) {
        workbenchService.addWbs(id, title, description, priority, parentId, assigneeName, dueDate);
        return redirect(id, "wbs");
    }
    @PostMapping("/projects/{id}/workbench/wbs/{wbsId}")
    public String updateWbs(@PathVariable Long id, @PathVariable Long wbsId, @RequestParam String status,
                            @RequestParam Integer progress) {
        workbenchService.updateWbs(id, wbsId, status, progress); return redirect(id, "wbs");
    }
    @PostMapping("/projects/{id}/workbench/wbs/{wbsId}/notes")
    public String addWbsNote(@PathVariable Long id, @PathVariable Long wbsId,
                             @RequestParam String noteText, Principal principal) {
        workbenchService.addWbsNote(id, wbsId, noteText, principal.getName());
        return redirect(id, "wbs");
    }
    @PostMapping("/projects/{id}/workbench/wbs/{wbsId}/artifacts")
    public String linkWbsArtifact(@PathVariable Long id, @PathVariable Long wbsId,
                                  @RequestParam Long artifactId) {
        workbenchService.linkWbsArtifact(id, wbsId, artifactId);
        return redirect(id, "wbs");
    }
    @PostMapping("/projects/{id}/workbench/stages")
    public String stage(@PathVariable Long id, @RequestParam Map<String,String> form, Principal principal) {
        Map<String,Object> assignment = new LinkedHashMap<>(form);
        assignment.put("changedBy", principal.getName());
        workbenchService.saveStage(id, assignment); return redirect(id, "dashboard");
    }
    @PostMapping("/projects/{id}/workbench/artifacts")
    public String artifact(@PathVariable Long id, @RequestParam String artifactType, Principal principal) {
        artifactService.generate(id, projectService.getProject(id), artifactType, principal.getName());
        return redirect(id, "artifacts");
    }
    @GetMapping("/projects/{id}/workbench/artifacts/{artifactId}/download")
    public ResponseEntity<org.springframework.core.io.ByteArrayResource> downloadArtifact(
            @PathVariable Long id, @PathVariable Long artifactId) {
        ArtifactService.Download download = artifactService.load(id, artifactId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.filename(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new org.springframework.core.io.ByteArrayResource(download.content()));
    }
    @PostMapping("/projects/{id}/workbench/attachments")
    public String uploadAttachment(@PathVariable Long id, @RequestParam(required=false) Long wikiPageId,
                                   @RequestParam("file") MultipartFile file) {
        attachmentService.store(id, wikiPageId, file);
        return redirect(id, "files");
    }
    @GetMapping("/projects/{id}/workbench/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        AttachmentService.Download download = attachmentService.load(id, attachmentId);
        MediaType mediaType;
        try { mediaType = MediaType.parseMediaType(download.mimeType()); }
        catch (Exception ignored) { mediaType = MediaType.APPLICATION_OCTET_STREAM; }
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.filename(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(download.resource());
    }
    @PostMapping("/projects/{id}/workbench/attachments/{attachmentId}/delete")
    public String deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        attachmentService.delete(id, attachmentId);
        return redirect(id, "files");
    }
    private String artifactTypeFor(String tab) {
        return switch (tab) {
            case "scan" -> "SOURCE_SUMMARY";
            case "review" -> "CODE_REVIEW";
            case "standard" -> "STANDARD_REPORT";
            case "security" -> "SECURITY_REVIEW";
            case "database" -> "DB_DDL";
            case "diagram" -> "DIAGRAM_DOCUMENT";
            case "api" -> "OPENAPI";
            case "wiki" -> "WIKI_DOCUMENT";
            case "wbs" -> "WBS_DOCUMENT";
            default -> null;
        };
    }
    private String redirect(Long id, String tab) { return "redirect:/projects/" + id + "/workbench?tab=" + tab; }
}
