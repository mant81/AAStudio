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
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApiTestExecutionService {
    private static final int MAX_RESPONSE_BYTES = 1_048_576;
    private final WorkbenchMapper mapper;
    private final ObjectMapper objectMapper;

    @Value("${app.api-test.allowed-hosts:localhost,127.0.0.1,::1}")
    private String allowedHosts;

    @Transactional
    public Result execute(Long projectId, Long testCaseId, String baseUrl) {
        Map<String, Object> test = mapper.selectApiTestCaseForExecution(projectId, testCaseId);
        if (test == null) throw new IllegalArgumentException("실행할 API 테스트 케이스를 찾을 수 없습니다.");
        URI target = target(baseUrl, string(test, "PATH"));
        String method = string(test, "METHOD").toUpperCase(Locale.ROOT);
        String requestBody = string(test, "REQUEST_JSON");
        HttpRequest.Builder request = HttpRequest.newBuilder(target)
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json");
        if (!requestBody.isBlank()) request.header("Content-Type", "application/json");
        applyAuth(request, test);
        request.method(method, requestBody.isBlank()
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8));

        long started = System.nanoTime();
        Integer statusCode = null;
        String responseBody = "";
        String resultStatus = "ERROR";
        String message = "";
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .build();
            HttpResponse<InputStream> response = client.send(request.build(), HttpResponse.BodyHandlers.ofInputStream());
            statusCode = response.statusCode();
            try (InputStream input = response.body()) {
                byte[] bytes = input.readNBytes(MAX_RESPONSE_BYTES + 1);
                if (bytes.length > MAX_RESPONSE_BYTES) throw new IllegalStateException("응답이 1MB 제한을 초과했습니다.");
                responseBody = new String(bytes, StandardCharsets.UTF_8);
            }
            int expected = number(test.get("EXPECTED_STATUS_CODE"), 200);
            resultStatus = statusCode == expected ? "PASSED" : "FAILED";
            message = statusCode == expected ? "Expected status matched" : "Expected HTTP " + expected;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            message = "API 테스트 실행이 중단되었습니다.";
        } catch (Exception e) {
            message = safeMessage(e);
        }
        long durationMs = Duration.ofNanos(System.nanoTime() - started).toMillis();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("testCaseId", testCaseId);
        result.put("requestSnapshot", requestBody);
        result.put("responseSnapshot", responseBody);
        result.put("statusCode", statusCode);
        result.put("resultStatus", resultStatus);
        result.put("message", message);
        result.put("durationMs", durationMs);
        mapper.insertApiTestResult(result);
        return new Result(resultStatus, statusCode, durationMs, message);
    }

    private URI target(String baseUrl, String endpointPath) {
        if (baseUrl == null || baseUrl.isBlank()) throw new IllegalArgumentException("Base URL을 입력하세요.");
        URI base;
        try { base = URI.create(baseUrl.trim()); }
        catch (Exception e) { throw new IllegalArgumentException("Base URL 형식이 유효하지 않습니다.", e); }
        if (!Set.of("http", "https").contains(base.getScheme()) || base.getHost() == null || base.getUserInfo() != null) {
            throw new IllegalArgumentException("HTTP(S) Base URL만 사용할 수 있습니다.");
        }
        Set<String> allowed = Arrays.stream(allowedHosts.split(",")).map(String::trim)
                .filter(value -> !value.isBlank()).map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        String host = base.getHost().toLowerCase(Locale.ROOT);
        if (!allowed.contains(host)) throw new IllegalArgumentException("허용되지 않은 API 테스트 호스트입니다: " + host);
        if (Set.of("localhost", "127.0.0.1", "::1").contains(host)) {
            try {
                if (Arrays.stream(InetAddress.getAllByName(host)).anyMatch(address -> !address.isLoopbackAddress())) {
                    throw new IllegalArgumentException("로컬 호스트가 loopback 주소로 확인되지 않았습니다.");
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("API 테스트 호스트를 확인할 수 없습니다.", e);
            }
        }
        String path = endpointPath == null ? "" : endpointPath.trim();
        if (!path.startsWith("/")) path = "/" + path;
        URI target = base.resolve(path);
        if (!host.equalsIgnoreCase(target.getHost())) throw new IllegalArgumentException("Endpoint가 허용된 호스트를 벗어났습니다.");
        return target;
    }

    private void applyAuth(HttpRequest.Builder request, Map<String, Object> test) {
        String type = string(test, "AUTH_TYPE").toUpperCase(Locale.ROOT);
        String config = string(test, "CONFIG_JSON");
        if (type.isBlank() || "NONE".equals(type) || config.isBlank()) return;
        try {
            JsonNode node = objectMapper.readTree(config);
            switch (type) {
                case "BEARER" -> request.header("Authorization", "Bearer " + env(node, "tokenEnv"));
                case "BASIC" -> {
                    String raw = env(node, "usernameEnv") + ":" + env(node, "passwordEnv");
                    request.header("Authorization", "Basic " + java.util.Base64.getEncoder()
                            .encodeToString(raw.getBytes(StandardCharsets.UTF_8)));
                }
                case "API_KEY" -> request.header(requiredText(node, "headerName"), env(node, "valueEnv"));
                default -> throw new IllegalArgumentException("지원하지 않는 인증 프로필입니다.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("인증 프로필 설정 JSON이 유효하지 않습니다.", e);
        }
    }

    private String env(JsonNode node, String field) {
        String name = requiredText(node, field);
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("환경 변수가 설정되지 않았습니다: " + name);
        return value;
    }
    private String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.isBlank()) throw new IllegalArgumentException("인증 설정에 " + field + " 값이 필요합니다.");
        return value;
    }
    private String string(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value == null ? "" : String.valueOf(value);
    }
    private int number(Object value, int fallback) {
        return value instanceof Number number ? number.intValue() : fallback;
    }
    private String safeMessage(Exception e) {
        String message = e.getMessage();
        if (message == null || message.isBlank()) return e.getClass().getSimpleName();
        return message.length() > 900 ? message.substring(0, 900) : message;
    }
    public record Result(String status, Integer statusCode, long durationMs, String message) {}
}
