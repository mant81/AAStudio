package com.aastudio.domain.workbench;

import com.aastudio.mapper.WorkbenchMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SourceAnalysisService {
    private static final Set<String> EXTENSIONS = Set.of(".java", ".kt", ".js", ".ts", ".py", ".sql", ".xml", ".yml", ".yaml", ".html");
    private static final int MAX_FILES = 2000;
    private static final long MAX_BYTES = 1_000_000;
    private final WorkbenchMapper mapper;

    @Value("${app.analysis-root:data/sources}")
    private String analysisRoot;

    public Path allowedRoot() {
        return Path.of(analysisRoot).toAbsolutePath().normalize();
    }

    @Transactional
    public Result analyze(Long projectId, Long scanId) {
        Map<String,Object> scan = mapper.selectScan(projectId, scanId);
        if (scan == null) throw new IllegalArgumentException("소스 스캔을 찾을 수 없습니다.");
        if ("COMPLETED".equals(scan.get("STATUS"))) throw new IllegalArgumentException("이미 완료된 스캔입니다. 새 스캔을 등록하세요.");
        Path allowed = allowedRoot();
        Path source = Path.of(String.valueOf(scan.get("SCAN_PATH"))).toAbsolutePath().normalize();
        if (!source.startsWith(allowed)) throw new IllegalArgumentException("분석 경로는 " + allowed + " 내부여야 합니다.");
        if (!Files.isDirectory(source)) throw new IllegalArgumentException("분석할 디렉터리가 존재하지 않습니다.");

        int files = 0;
        int codeIssues = 0;
        int securityIssues = 0;
        List<String> languages = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(source)) {
            for (Path file : paths.filter(Files::isRegularFile).filter(this::supported).limit(MAX_FILES).toList()) {
                files++;
                String language = language(extension(file));
                if (!languages.contains(language)) languages.add(language);
                if (Files.size(file) > MAX_BYTES) continue;
                List<String> lines;
                try { lines = Files.readAllLines(file, StandardCharsets.UTF_8); } catch (IOException ignored) { continue; }
                for (int index = 0; index < lines.size(); index++) {
                    String line = lines.get(index);
                    String relative = source.relativize(file).toString();
                    if (line.contains("TODO") || line.contains("FIXME")) {
                        mapper.insertAnalyzedCodeIssue(code(projectId, scanId, relative, index + 1,
                                "PENDING_WORK", "INFO", "미완료 작업 주석", line));
                        codeIssues++;
                    }
                    if (line.contains("System.out.print") || line.contains("printStackTrace()")) {
                        mapper.insertAnalyzedCodeIssue(code(projectId, scanId, relative, index + 1,
                                "CONSOLE_OUTPUT", "MINOR", "직접 콘솔 출력", line));
                        codeIssues++;
                    }
                    String lower = line.toLowerCase(Locale.ROOT);
                    if ((lower.contains("password") || lower.contains("secret") || lower.contains("api_key"))
                            && line.matches(".*[\"'][^\"']+[\"'].*")) {
                        mapper.insertAnalyzedSecurityIssue(security(projectId, scanId, relative,
                                "HARDCODED_SECRET", "하드코딩 비밀정보 후보", "HIGH", line,
                                "환경 변수 또는 안전한 비밀 저장소를 사용하세요."));
                        securityIssues++;
                    }
                    if (line.contains("Runtime.getRuntime().exec") || line.contains("ProcessBuilder(")) {
                        mapper.insertAnalyzedSecurityIssue(security(projectId, scanId, relative,
                                "COMMAND_INJECTION", "외부 프로세스 실행 검토", "HIGH", line,
                                "고정 명령과 허용 목록을 적용하세요."));
                        securityIssues++;
                    }
                    if (line.contains("\"http://") || line.contains("'http://")) {
                        mapper.insertAnalyzedSecurityIssue(security(projectId, scanId, relative,
                                "PLAINTEXT_TRANSPORT", "평문 HTTP 후보", "MEDIUM", line,
                                "HTTPS 전송을 사용하세요."));
                        securityIssues++;
                    }
                }
            }
        } catch (IOException e) {
            mapper.updateScanResult(projectId, scanId, "FAILED", "", "", files, codeIssues, securityIssues);
            throw new IllegalStateException("소스 분석 중 파일을 읽지 못했습니다.", e);
        }
        String framework = framework(source);
        mapper.updateScanResult(projectId, scanId, "COMPLETED", String.join(", ", languages), framework,
                files, codeIssues, securityIssues);
        return new Result(files, codeIssues, securityIssues);
    }

    private boolean supported(Path file) {
        String path = file.toString().replace('\\', '/');
        return !path.contains("/.git/") && !path.contains("/build/") && !path.contains("/target/")
                && !path.contains("/node_modules/") && EXTENSIONS.contains(extension(file));
    }
    private String extension(Path file) {
        String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot);
    }
    private String language(String extension) {
        return switch (extension) {
            case ".java" -> "Java"; case ".kt" -> "Kotlin"; case ".js", ".ts" -> "JavaScript/TypeScript";
            case ".py" -> "Python"; case ".sql" -> "SQL"; default -> "Markup/Config";
        };
    }
    private String framework(Path source) {
        if (Files.exists(source.resolve("build.gradle")) || Files.exists(source.resolve("pom.xml"))) return "Spring/Java";
        if (Files.exists(source.resolve("package.json"))) return "Node.js";
        if (Files.exists(source.resolve("pyproject.toml")) || Files.exists(source.resolve("requirements.txt"))) return "Python";
        return "Unknown";
    }
    private Map<String,Object> code(Long projectId, Long scanId, String file, int line, String rule,
                                    String severity, String summary, String detail) {
        Map<String,Object> map = base(projectId, scanId, file);
        map.put("line", line); map.put("ruleName", rule); map.put("severity", severity);
        map.put("summary", summary); map.put("detail", detail.trim()); map.put("confidence", 1.0);
        return map;
    }
    private Map<String,Object> security(Long projectId, Long scanId, String file, String category,
                                        String title, String risk, String evidence, String recommendation) {
        Map<String,Object> map = base(projectId, scanId, file);
        map.put("category", category); map.put("title", title); map.put("description", "규칙 기반 정적 분석 후보");
        map.put("riskLevel", risk); map.put("evidence", evidence.trim()); map.put("recommendation", recommendation);
        return map;
    }
    private Map<String,Object> base(Long projectId, Long scanId, String file) {
        Map<String,Object> map = new LinkedHashMap<>();
        map.put("projectId", projectId); map.put("scanId", scanId); map.put("filePath", file);
        return map;
    }
    public record Result(int files, int codeIssues, int securityIssues) {}
}
