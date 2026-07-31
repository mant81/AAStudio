package com.aastudio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aastudio.domain.workbench.WorkbenchService;
import com.aastudio.domain.workbench.SourceAnalysisService;
import com.aastudio.domain.workbench.ArtifactService;
import com.aastudio.domain.workbench.ApiTestExecutionService;
import com.aastudio.domain.workbench.ShareService;
import com.aastudio.domain.workbench.AttachmentService;
import com.aastudio.domain.workbench.LocalLlmReviewService;
import com.aastudio.domain.workbench.ApiSourceSyncService;
import com.aastudio.domain.project.ProjectService;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.util.ReflectionTestUtils;

@SpringBootTest(properties = "app.analysis-root=data/test-sources")
@AutoConfigureMockMvc
@Transactional
@DirtiesContext
class WorkbenchIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired WorkbenchService service;
    @Autowired SourceAnalysisService sourceAnalysisService;
    @Autowired ArtifactService artifactService;
    @Autowired ApiTestExecutionService apiTestExecutionService;
    @Autowired ShareService shareService;
    @Autowired AttachmentService attachmentService;
    @Autowired LocalLlmReviewService localLlmReviewService;
    @Autowired ApiSourceSyncService apiSourceSyncService;
    @Autowired ProjectService projectService;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    void authenticatesSeededAdminUser() throws Exception {
        mockMvc.perform(formLogin().user("admin").password("admin1234"))
                .andExpect(authenticated().withUsername("admin"))
                .andExpect(redirectedUrl("/"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void rendersWorkbenchAndPersistsCoreDrafts() throws Exception {
        service.addScan(1L, "D:/workspace/sample", "Java", "Spring Boot");
        service.addProjectWorkspace(1L, "Main analysis", "ANALYSIS");
        service.saveDashboardSummary(1L, "Architecture review in progress");
        Long scanId = jdbcTemplate.queryForObject("SELECT id FROM source_scan WHERE project_id=1", Long.class);
        service.addSecurityScan(1L, scanId, "STATIC", "Secure coding baseline");
        service.addSecurityExternalResult(1L, "External Scanner", "Imported baseline", "{\"findings\":[]}");
        service.addDbModel(1L, "Core model", "Main schema", "CREATE TABLE sample(id BIGINT);");
        Long modelId = jdbcTemplate.queryForObject("SELECT id FROM db_model WHERE name='Core model'", Long.class);
        service.addDbTable(1L, modelId, "project_item", "Project items", "id");
        service.addDbTable(1L, modelId, "project_note", "Project notes", "id");
        Long itemTableId = jdbcTemplate.queryForObject("SELECT id FROM db_table WHERE name='project_item'", Long.class);
        Long noteTableId = jdbcTemplate.queryForObject("SELECT id FROM db_table WHERE name='project_note'", Long.class);
        service.addDbColumn(1L, itemTableId, "id", "BIGINT", "N", "", "Y", "Y", "Y", "Primary key");
        service.addDbColumn(1L, noteTableId, "item_id", "BIGINT", "N", "", "N", "N", "Y", "Foreign key");
        service.addDbRelation(1L, modelId, noteTableId, itemTableId, "MANY_TO_ONE", "item_id", "id", "Note owner");
        service.addDiagram(1L, "Service flow", "FLOW", "{\"nodes\":[],\"edges\":[]}");
        service.addApi(1L, "get", "/api/projects", "Project list");
        service.addApiGroup(1L, "Projects", "Project APIs");
        service.addApiSchema(1L, "ProjectResponse", "RESPONSE", "{\"type\":\"object\"}");
        service.addWiki(1L, "Architecture", "# Architecture", "design", "admin");
        service.addWbs(1L, "Review architecture", "Confirm module boundaries", "HIGH");
        service.addCodeIssue(1L, "src/App.java", "NULL_CHECK", "MAJOR", "Null check missing", "Review input");
        service.addSecurityIssue(1L, "XSS", "Output encoding candidate", "Review rendering", "templates/page.html",
                "HIGH", "Unescaped output", "Use escaped rendering");
        service.addStandardTerm(1L, "usrNm", "userName", "MATCHED", "Use userName", "Reviewed");
        service.addApiAuthProfile(1L, "Local token", "BEARER", "{\"tokenEnv\":\"API_TOKEN\"}", "Y");
        service.addSampleDataset(1L, "Default request", "API sample", "{\"id\":1}", "N");

        Map<String, Object> view = service.load(1L);
        assertThat(view.get("scans")).asList().hasSize(1);
        assertThat(view.get("projectWorkspaces")).asList().hasSize(1);
        assertThat(view.get("projectDashboard")).isNotNull();
        assertThat(view.get("dbModels")).asList().hasSize(1);
        assertThat(view.get("dbTables")).asList().hasSize(2);
        assertThat(view.get("dbColumns")).asList().hasSize(2);
        assertThat(view.get("dbRelations")).asList().hasSize(1);
        assertThat(view.get("dbChangeHistory")).asList().hasSize(6);
        assertThat(view.get("diagrams")).asList().hasSize(1);
        assertThat(view.get("apiEndpoints")).asList().hasSize(1);
        assertThat(view.get("apiGroups")).asList().hasSize(1);
        assertThat(view.get("apiSchemas")).asList().hasSize(1);
        assertThat(view.get("wikiPages")).asList().hasSize(1);
        assertThat(view.get("wbsItems")).asList().hasSize(1);
        assertThat(view.get("codeIssues")).asList().hasSize(1);
        assertThat(view.get("securityIssues")).asList().hasSize(1);
        assertThat(view.get("securityScans")).asList().hasSize(1);
        assertThat(view.get("securityExternalResults")).asList().hasSize(1);
        assertThat(view.get("standardTerms")).asList().hasSize(1);
        Long standardTermId = jdbcTemplate.queryForObject(
                "SELECT id FROM standard_term WHERE project_id=1 AND source_word='usrNm'", Long.class);
        service.bulkUpdateStandardTerms(1L, java.util.List.of(standardTermId), "REVIEW", "EXCLUDE");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT match_status FROM standard_term WHERE id=?", String.class, standardTermId)).isEqualTo("REVIEW");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT excluded FROM standard_term WHERE id=?", String.class, standardTermId)).isEqualTo("Y");
        assertThat(view.get("apiAuthProfiles")).asList().hasSize(1);
        assertThat(view.get("sampleDatasets")).asList().hasSize(1);
        Long codeIssueId = jdbcTemplate.queryForObject("SELECT id FROM source_code_scan WHERE project_id=1", Long.class);
        Long securityIssueId = jdbcTemplate.queryForObject("SELECT id FROM security_issue WHERE project_id=1", Long.class);
        service.reviewCodeIssue(1L, codeIssueId, "CONFIRMED", "Needs a fix");
        service.reviewSecurityIssue(1L, securityIssueId, "FALSE_POSITIVE", "Escaped by template engine");
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM source_code_scan WHERE id=?", String.class, codeIssueId))
                .isEqualTo("CONFIRMED");
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM security_issue WHERE id=?", String.class, securityIssueId))
                .isEqualTo("FALSE_POSITIVE");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM wiki_page_version", Integer.class)).isEqualTo(1);

        Long wikiId = jdbcTemplate.queryForObject("SELECT id FROM wiki_page WHERE title='Architecture'", Long.class);
        service.updateWiki(1L, wikiId, "Architecture", "# Architecture v2", "design", "Reviewed", "admin");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM wiki_page_version WHERE wiki_page_id=?", Integer.class, wikiId)).isEqualTo(2);
        Long firstVersion = jdbcTemplate.queryForObject(
                "SELECT MIN(id) FROM wiki_page_version WHERE wiki_page_id=?", Long.class, wikiId);
        service.restoreWiki(1L, wikiId, firstVersion, "admin");
        assertThat(jdbcTemplate.queryForObject("SELECT content FROM wiki_page WHERE id=?", String.class, wikiId))
                .isEqualTo("# Architecture");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM wiki_page_version WHERE wiki_page_id=?", Integer.class, wikiId)).isEqualTo(3);

        Long wbsId = jdbcTemplate.queryForObject("SELECT id FROM wbs_item WHERE title='Review architecture'", Long.class);
        service.updateWbs(1L, wbsId, "IN_PROGRESS", 45);
        assertThat(jdbcTemplate.queryForObject("SELECT progress FROM wbs_item WHERE id=?", Integer.class, wbsId)).isEqualTo(45);
        Long endpointId = jdbcTemplate.queryForObject("SELECT id FROM api_endpoint WHERE path='/api/projects'", Long.class);
        Long authId = jdbcTemplate.queryForObject("SELECT id FROM api_auth_profile WHERE name='Local token'", Long.class);
        Long datasetId = jdbcTemplate.queryForObject("SELECT id FROM sample_dataset WHERE name='Default request'", Long.class);
        service.addSampleDatasetItem(1L, datasetId, "projectId", "{\"value\":1}");
        service.addApiTestCase(1L, endpointId, authId, "List projects", "{}", 200, "[]", datasetId);
        assertThat(service.load(1L).get("apiTestCases")).asList().hasSize(1);
        assertThat(service.load(1L).get("sampleDatasetItems")).asList().hasSize(1);
        artifactService.generate(1L, projectService.getProject(1L), "DB_DDL", "admin");
        artifactService.generate(1L, projectService.getProject(1L), "OPENAPI", "admin");
        artifactService.generate(1L, projectService.getProject(1L), "STANDARD_REPORT", "admin");
        artifactService.generate(1L, projectService.getProject(1L), "STANDARD_CSV", "admin");
        artifactService.generate(1L, projectService.getProject(1L), "DIAGRAM_DOCUMENT", "admin");
        artifactService.generate(1L, projectService.getProject(1L), "API_TEST_REPORT", "admin");
        assertThat(service.load(1L).get("artifacts")).asList().hasSize(6);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT content_text FROM project_artifact WHERE artifact_type='OPENAPI'", String.class))
                .contains("\"openapi\":\"3.0.3\"");
        Long csvArtifactId = jdbcTemplate.queryForObject(
                "SELECT id FROM project_artifact WHERE artifact_type='STANDARD_CSV'", Long.class);
        service.addWbsNote(1L, wbsId, "Architecture review started", "admin");
        service.linkWbsArtifact(1L, wbsId, csvArtifactId);
        assertThat(service.load(1L).get("wbsNotes")).asList().hasSize(1);
        assertThat(service.load(1L).get("wbsArtifactLinks")).asList().hasSize(1);
        mockMvc.perform(get("/projects/1/workbench/artifacts/{artifactId}/download", csvArtifactId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("usrNm")));

        mockMvc.perform(get("/projects/1/workbench").param("tab", "dashboard"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Project Workbench")));
        mockMvc.perform(get("/projects/1/workbench").param("tab", "wiki").param("wikiId", String.valueOf(wikiId)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Architecture")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Versions")));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM access_log WHERE project_id=1", Integer.class)).isPositive();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void savesStageAssignmentThroughWebFlow() throws Exception {
        mockMvc.perform(post("/projects/1/workbench/stages").with(csrf())
                        .param("stageName", "Analysis")
                        .param("assigneeName", "Kim")
                        .param("assigneeTitle", "Senior")
                        .param("assigneePhone", "010-1234-5678")
                        .param("assigneeEmail", "kim@example.com")
                        .param("roleName", "Reviewer")
                        .param("status", "IN_PROGRESS"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/projects/1/workbench?tab=dashboard"));

        assertThat(service.load(1L).get("stageAssignments")).asList().hasSize(1);
        assertThat(service.load(1L).get("stageHistory")).asList().hasSize(1);
        assertThat(jdbcTemplate.queryForObject("SELECT current_stage FROM project WHERE id=1", String.class))
                .isEqualTo("Analysis");
        mockMvc.perform(get("/projects/1/workbench").param("tab", "dashboard"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("010-1234-5678")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("kim@example.com")));
    }

    @Test
    @WithMockUser(username = "viewer", roles = "READONLY")
    void readonlyUserCanViewButCannotModifyWorkbench() throws Exception {
        mockMvc.perform(get("/projects/1/workbench").param("tab", "wiki"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/projects/1/workbench/wiki").with(csrf())
                        .param("title", "Forbidden edit")
                        .param("content", "readonly"))
                .andExpect(status().isForbidden());

        MockMultipartFile file = new MockMultipartFile(
                "file", "blocked.txt", "text/plain", "blocked".getBytes());
        mockMvc.perform(multipart("/projects/1/workbench/attachments").file(file).with(csrf()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/projects/1/workbench/api-tests/1/execute").with(csrf())
                        .param("baseUrl", "http://127.0.0.1:8081"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void uploadsDownloadsAndDeletesProjectAttachment() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "설계 메모.txt", "text/plain", "local attachment".getBytes());

        mockMvc.perform(multipart("/projects/1/workbench/attachments").file(file).with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/projects/1/workbench?tab=files"));

        Long attachmentId = jdbcTemplate.queryForObject(
                "SELECT id FROM attachment WHERE project_id=1 AND original_name='설계 메모.txt'", Long.class);
        mockMvc.perform(get("/projects/1/workbench/attachments/{id}", attachmentId))
                .andExpect(status().isOk())
                .andExpect(content().bytes("local attachment".getBytes()));

        mockMvc.perform(post("/projects/1/workbench/attachments/{id}/delete", attachmentId).with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/projects/1/workbench?tab=files"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attachment WHERE id=?", Integer.class, attachmentId)).isZero();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void executesAllowedLoopbackApiAndStoresResult() throws Exception {
        service.addApi(1L, "GET", "/health", "Health check");
        Long endpointId = jdbcTemplate.queryForObject(
                "SELECT id FROM api_endpoint WHERE project_id=1 AND path='/health'", Long.class);
        service.addApiTestCase(1L, endpointId, null, "Local health", "", 200, "{\"ok\":true}", null);
        Long testCaseId = jdbcTemplate.queryForObject(
                "SELECT id FROM api_test_case WHERE project_id=1 AND name='Local health'", Long.class);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/health", exchange -> {
            byte[] body = "{\"ok\":true}".getBytes();
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            ApiTestExecutionService.Result result = apiTestExecutionService.execute(
                    1L, testCaseId, "http://127.0.0.1:" + server.getAddress().getPort());
            assertThat(result.status()).isEqualTo("PASSED");
            assertThat(result.statusCode()).isEqualTo(200);
            assertThat(jdbcTemplate.queryForObject(
                    "SELECT response_snapshot_json FROM api_test_result WHERE api_test_case_id=?",
                    String.class, testCaseId)).contains("\"ok\":true");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void rejectsApiExecutionOutsideConfiguredHosts() {
        service.addApi(1L, "GET", "/health", "Health check");
        Long endpointId = jdbcTemplate.queryForObject(
                "SELECT id FROM api_endpoint WHERE project_id=1 AND path='/health'", Long.class);
        service.addApiTestCase(1L, endpointId, null, "Blocked host", "", 200, "", null);
        Long testCaseId = jdbcTemplate.queryForObject(
                "SELECT id FROM api_test_case WHERE project_id=1 AND name='Blocked host'", Long.class);

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                apiTestExecutionService.execute(1L, testCaseId, "http://example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("허용되지 않은");
    }

    @Test
    void exposesApprovedReadonlyShareAndBlocksItAfterRevocation() throws Exception {
        attachmentService.store(1L, null, new MockMultipartFile(
                "file", "shared.txt", "text/plain", "shared content".getBytes()));
        Long attachmentId = jdbcTemplate.queryForObject(
                "SELECT id FROM attachment WHERE project_id=1 AND original_name='shared.txt'", Long.class);
        String token = shareService.create(1L, "External review", java.time.LocalDateTime.now().plusDays(2),
                true, "admin");
        Long shareId = jdbcTemplate.queryForObject(
                "SELECT id FROM project_share_token WHERE project_id=1 AND label='External review'", Long.class);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_share_token WHERE token_hash=?", Integer.class, token)).isZero();
        mockMvc.perform(get("/share/{token}", token))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("AAStudio readonly share")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Dashboard workspace")))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("Logout"))));
        mockMvc.perform(get("/share/{token}/attachments/{attachmentId}", token, attachmentId))
                .andExpect(status().isOk())
                .andExpect(content().bytes("shared content".getBytes()));

        shareService.revoke(1L, shareId);
        mockMvc.perform(get("/share/{token}", token))
                .andExpect(status().is4xxClientError())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/share/[redacted]")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(token))));
        attachmentService.delete(1L, attachmentId);
    }

    @Test
    void shareWithoutDownloadPermissionCannotReadAttachment() throws Exception {
        attachmentService.store(1L, null, new MockMultipartFile(
                "file", "private.txt", "text/plain", "private".getBytes()));
        Long attachmentId = jdbcTemplate.queryForObject(
                "SELECT id FROM attachment WHERE project_id=1 AND original_name='private.txt'", Long.class);
        String token = shareService.create(1L, "View only", java.time.LocalDateTime.now().plusDays(1),
                false, "admin");

        mockMvc.perform(get("/share/{token}/attachments/{attachmentId}", token, attachmentId))
                .andExpect(status().is4xxClientError());
        attachmentService.delete(1L, attachmentId);
    }

    @Test
    void storesReviewFromLoopbackLocalLlm() throws Exception {
        service.addCodeIssue(1L, "src/Service.java", "NULL_CHECK", "MAJOR",
                "Null guard missing", "Input is dereferenced before validation");
        Long issueId = jdbcTemplate.queryForObject(
                "SELECT id FROM source_code_scan WHERE project_id=1 AND summary='Null guard missing'", Long.class);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/generate", exchange -> {
            byte[] body = "{\"response\":\"입력값을 먼저 검증하고 null 처리 정책을 명시하세요.\"}".getBytes();
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        ReflectionTestUtils.setField(localLlmReviewService, "baseUrl",
                "http://127.0.0.1:" + server.getAddress().getPort());
        try {
            String explanation = localLlmReviewService.explain(1L, issueId);
            assertThat(explanation).contains("입력값");
            assertThat(jdbcTemplate.queryForObject(
                    "SELECT llm_explanation FROM source_code_scan WHERE id=?", String.class, issueId))
                    .contains("null 처리 정책");
            assertThat(jdbcTemplate.queryForObject(
                    "SELECT llm_model FROM source_code_scan WHERE id=?", String.class, issueId))
                    .isEqualTo("qwen2.5-coder:7b");
        } finally {
            ReflectionTestUtils.setField(localLlmReviewService, "baseUrl", "http://127.0.0.1:11434");
            server.stop(0);
        }
    }

    @Test
    void synchronizesSpringMappingsWithoutDeletingManualApis() throws Exception {
        Path source = sourceAnalysisService.allowedRoot().resolve("api-sync").normalize();
        Files.createDirectories(source);
        Files.writeString(source.resolve("ProjectController.java"), """
                class ProjectController {
                    @GetMapping("/api/projects")
                    void list() {}
                    @PostMapping(value = "/api/projects")
                    void create() {}
                }
                """);
        service.addScan(1L, source.toString(), "Java", "Spring Boot");
        Long scanId = jdbcTemplate.queryForObject(
                "SELECT MAX(id) FROM source_scan WHERE project_id=1", Long.class);
        service.addApi(1L, "GET", "/manual", "Manual endpoint");

        assertThat(apiSourceSyncService.synchronize(1L, scanId)).isEqualTo(2);
        assertThat(apiSourceSyncService.synchronize(1L, scanId)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM api_endpoint WHERE project_id=1 AND source_type='SOURCE_SYNC'",
                Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM api_endpoint WHERE project_id=1 AND source_type='MANUAL'",
                Integer.class)).isEqualTo(1);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void analyzesOnlySourceInsideConfiguredRoot() throws Exception {
        Path source = sourceAnalysisService.allowedRoot().resolve("sample").normalize();
        Files.createDirectories(source);
        Files.writeString(source.resolve("Sample.java"),
                "class Sample { // TODO review\nString password = \"unsafe\";\nSystem.out.println(password);\n}");
        service.addScan(1L, source.toString(), "", "");
        Long scanId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM source_scan WHERE project_id=1", Long.class);

        SourceAnalysisService.Result result = sourceAnalysisService.analyze(1L, scanId);
        assertThat(result.files()).isEqualTo(1);
        assertThat(result.codeIssues()).isEqualTo(2);
        assertThat(result.securityIssues()).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM source_scan WHERE id=?", String.class, scanId))
                .isEqualTo("COMPLETED");
    }

    @ParameterizedTest
    @ValueSource(strings = {"dashboard", "scan", "review", "standard", "security", "database", "diagram", "api", "wiki", "wbs", "files", "share", "artifacts"})
    @WithMockUser(username = "admin", roles = "ADMIN")
    void rendersEveryWorkbenchTab(String tab) throws Exception {
        mockMvc.perform(get("/projects/1/workbench").param("tab", tab))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("workbench-content")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"scan", "review", "standard", "security", "database", "diagram", "api", "wiki", "wbs"})
    @WithMockUser(username = "admin", roles = "ADMIN")
    void exposesFinalArtifactActionOnEachProductionTab(String tab) throws Exception {
        mockMvc.perform(get("/projects/1/workbench").param("tab", tab))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Generate final artifact")));
    }
}
