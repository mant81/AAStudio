package com.aastudio.domain.workbench;

import com.aastudio.mapper.WorkbenchMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApiSourceSyncService {
    private static final Pattern MAPPING = Pattern.compile(
            "@(Get|Post|Put|Patch|Delete)Mapping\\s*\\(\\s*(?:value\\s*=\\s*)?[\"']([^\"']+)[\"']",
            Pattern.CASE_INSENSITIVE);
    private final WorkbenchMapper mapper;
    private final SourceAnalysisService sourceAnalysisService;

    @Transactional
    public int synchronize(Long projectId, Long scanId) {
        Map<String, Object> scan = mapper.selectScan(projectId, scanId);
        if (scan == null) throw new IllegalArgumentException("동기화할 소스 스캔을 찾을 수 없습니다.");
        Path root = sourceAnalysisService.allowedRoot();
        Path source = Path.of(String.valueOf(scan.get("SCAN_PATH"))).toAbsolutePath().normalize();
        if (!source.startsWith(root) || !Files.isDirectory(source)) {
            throw new IllegalArgumentException("허용된 분석 루트 내부의 소스만 동기화할 수 있습니다.");
        }
        Set<Endpoint> endpoints = new LinkedHashSet<>();
        try (var paths = Files.walk(source)) {
            paths.filter(Files::isRegularFile)
                    .filter(path -> {
                        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
                        return name.endsWith(".java") || name.endsWith(".kt");
                    })
                    .forEach(path -> collect(source, path, endpoints));
        } catch (IOException e) {
            throw new IllegalStateException("API 소스 동기화에 실패했습니다.", e);
        }
        mapper.deleteSyncedApiEndpoints(projectId);
        endpoints.forEach(endpoint -> mapper.insertSyncedApiEndpoint(projectId, endpoint.method(),
                endpoint.path(), endpoint.summary()));
        return endpoints.size();
    }

    private void collect(Path source, Path file, Set<Endpoint> endpoints) {
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            Matcher matcher = MAPPING.matcher(content);
            while (matcher.find()) {
                String method = matcher.group(1).toUpperCase(Locale.ROOT);
                String path = matcher.group(2).startsWith("/") ? matcher.group(2) : "/" + matcher.group(2);
                endpoints.add(new Endpoint(method, path,
                        "Synced from " + source.relativize(file).toString().replace('\\', '/')));
            }
        } catch (IOException e) {
            throw new IllegalStateException("API 선언을 읽지 못했습니다: " + file.getFileName(), e);
        }
    }

    private record Endpoint(String method, String path, String summary) {}
}
