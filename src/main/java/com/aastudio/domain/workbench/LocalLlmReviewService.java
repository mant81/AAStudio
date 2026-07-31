package com.aastudio.domain.workbench;

import com.aastudio.mapper.WorkbenchMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocalLlmReviewService {
    private static final int MAX_RESPONSE_BYTES = 262_144;
    private final WorkbenchMapper mapper;
    private final ObjectMapper objectMapper;

    @Value("${app.local-llm.base-url:http://127.0.0.1:11434}")
    private String baseUrl;
    @Value("${app.local-llm.model:qwen2.5-coder:7b}")
    private String model;

    public String explain(Long projectId, Long issueId) {
        Map<String, Object> issue = mapper.selectCodeIssue(projectId, issueId);
        if (issue == null) throw new IllegalArgumentException("설명할 코드 이슈를 찾을 수 없습니다.");
        URI endpoint = endpoint();
        String prompt = """
                You are a local secure-code reviewer. Explain the finding below in Korean.
                Provide: why it matters, how to verify it, and a concrete remediation.
                Do not invent code not present in the finding.

                File: %s
                Rule: %s
                Severity: %s
                Summary: %s
                Detail: %s
                """.formatted(value(issue, "FILE_PATH"), value(issue, "RULE_NAME"), value(issue, "SEVERITY"),
                value(issue, "SUMMARY"), value(issue, "DETAIL"));
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "model", model, "prompt", prompt, "stream", false));
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8)).build();
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) throw new IllegalStateException("로컬 LLM이 HTTP " + response.statusCode() + "을 반환했습니다.");
            String body;
            try (InputStream input = response.body()) {
                byte[] bytes = input.readNBytes(MAX_RESPONSE_BYTES + 1);
                if (bytes.length > MAX_RESPONSE_BYTES) throw new IllegalStateException("로컬 LLM 응답이 제한을 초과했습니다.");
                body = new String(bytes, StandardCharsets.UTF_8);
            }
            JsonNode json = objectMapper.readTree(body);
            String explanation = json.path("response").asText("").trim();
            if (explanation.isBlank()) throw new IllegalStateException("로컬 LLM 응답에 설명이 없습니다.");
            mapper.updateCodeIssueLlmReview(projectId, issueId, explanation, model);
            return explanation;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("로컬 LLM 요청이 중단되었습니다.", e);
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("로컬 LLM 리뷰에 실패했습니다.", e);
        }
    }

    private URI endpoint() {
        URI base;
        try { base = URI.create(baseUrl); }
        catch (Exception e) { throw new IllegalArgumentException("로컬 LLM URL이 유효하지 않습니다.", e); }
        if (!"http".equals(base.getScheme()) || base.getHost() == null || base.getUserInfo() != null) {
            throw new IllegalArgumentException("로컬 LLM은 loopback HTTP URL만 사용할 수 있습니다.");
        }
        try {
            if (java.util.Arrays.stream(InetAddress.getAllByName(base.getHost()))
                    .anyMatch(address -> !address.isLoopbackAddress())) {
                throw new IllegalArgumentException("로컬 LLM 호스트는 loopback 주소여야 합니다.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("로컬 LLM 호스트를 확인할 수 없습니다.", e);
        }
        return base.resolve("/api/generate");
    }

    private String value(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? "" : String.valueOf(value);
    }
}
