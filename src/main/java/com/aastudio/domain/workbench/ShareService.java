package com.aastudio.domain.workbench;

import com.aastudio.domain.project.ProjectService;
import com.aastudio.domain.project.ProjectVO;
import com.aastudio.mapper.WorkbenchMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShareService {
    private final WorkbenchMapper mapper;
    private final ProjectService projectService;
    private final SecureRandom secureRandom = new SecureRandom();

    public List<Map<String, Object>> list(Long projectId) {
        return mapper.selectShareTokens(projectId);
    }

    @Transactional
    public String create(Long projectId, String label, LocalDateTime expiresAt,
                         boolean allowDownload, String actor) {
        projectService.getProject(projectId);
        LocalDateTime now = LocalDateTime.now();
        if (expiresAt == null || !expiresAt.isAfter(now)) {
            throw new IllegalArgumentException("공유 만료일은 현재보다 이후여야 합니다.");
        }
        if (expiresAt.isAfter(now.plusYears(1))) {
            throw new IllegalArgumentException("공유 기간은 최대 1년입니다.");
        }
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Map<String, Object> token = new LinkedHashMap<>();
        token.put("projectId", projectId);
        token.put("tokenHash", hash(rawToken));
        token.put("label", label == null || label.isBlank() ? "Readonly share" : label.trim());
        token.put("expiresAt", Timestamp.valueOf(expiresAt));
        token.put("allowDownload", allowDownload ? "Y" : "N");
        token.put("createdBy", actor);
        mapper.insertShareToken(token);
        return rawToken;
    }

    public SharedProject resolve(String rawToken) {
        Map<String, Object> token = validToken(rawToken);
        Long projectId = ((Number) token.get("PROJECT_ID")).longValue();
        ProjectVO project = projectService.getProject(projectId);
        return new SharedProject(project, mapper.selectProjectDashboard(projectId), mapper.selectStageAssignments(projectId),
                mapper.selectDiagrams(projectId), mapper.selectWikiPages(projectId), mapper.selectWbsItems(projectId),
                mapper.selectArtifacts(projectId), mapper.selectShareAttachments(projectId),
                "Y".equals(token.get("ALLOW_DOWNLOAD")));
    }

    public Long downloadableProject(String rawToken) {
        Map<String, Object> token = validToken(rawToken);
        if (!"Y".equals(token.get("ALLOW_DOWNLOAD"))) {
            throw new IllegalArgumentException("이 공유 링크에서는 파일 다운로드가 허용되지 않습니다.");
        }
        return ((Number) token.get("PROJECT_ID")).longValue();
    }

    public void revoke(Long projectId, Long shareId) {
        if (mapper.revokeShareToken(projectId, shareId) == 0) {
            throw new IllegalArgumentException("공유 링크를 찾을 수 없습니다.");
        }
    }

    private Map<String, Object> validToken(String rawToken) {
        if (rawToken == null || rawToken.length() < 32 || rawToken.length() > 100) {
            throw new IllegalArgumentException("공유 링크가 유효하지 않습니다.");
        }
        Map<String, Object> token = mapper.selectShareTokenByHash(hash(rawToken));
        if (token == null || !"Y".equals(token.get("ENABLED"))) {
            throw new IllegalArgumentException("공유 링크가 유효하지 않습니다.");
        }
        LocalDateTime expiresAt = expiresAt(token.get("EXPIRES_AT"));
        if (!expiresAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("공유 링크가 만료되었습니다.");
        }
        return token;
    }

    private LocalDateTime expiresAt(Object value) {
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof Number number) {
            long epoch = number.longValue();
            if (Math.abs(epoch) < 100_000_000_000L) epoch *= 1000;
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(epoch), ZoneId.systemDefault());
        }
        return LocalDateTime.parse(String.valueOf(value).replace(' ', 'T'));
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("공유 토큰 해시를 생성할 수 없습니다.", e);
        }
    }

    public record SharedProject(ProjectVO project, Map<String, Object> dashboard,
                                List<Map<String, Object>> stages, List<Map<String, Object>> diagrams,
                                List<Map<String, Object>> wikiPages, List<Map<String, Object>> wbsItems,
                                List<Map<String, Object>> artifacts, List<Map<String, Object>> attachments,
                                boolean allowDownload) {}
}
