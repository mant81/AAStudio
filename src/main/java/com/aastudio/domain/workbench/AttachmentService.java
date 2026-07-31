package com.aastudio.domain.workbench;

import com.aastudio.mapper.WorkbenchMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AttachmentService {
    private final WorkbenchMapper mapper;

    @Value("${app.storage-root:data}")
    private String storageRoot;

    @Value("${app.attachment.max-size-bytes:26214400}")
    private long maxSizeBytes;

    @Transactional
    public void store(Long projectId, Long wikiPageId, MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("업로드할 파일을 선택하세요.");
        if (file.getSize() > maxSizeBytes) throw new IllegalArgumentException("첨부파일은 25MB 이하만 업로드할 수 있습니다.");
        if (wikiPageId != null && mapper.selectWikiPage(projectId, wikiPageId) == null) {
            throw new IllegalArgumentException("프로젝트에 속한 Wiki 페이지만 연결할 수 있습니다.");
        }
        String original = cleanName(file.getOriginalFilename());
        String extension = extension(original);
        String stored = UUID.randomUUID() + extension;
        Path base = Path.of(storageRoot).toAbsolutePath().normalize().resolve("attachments").resolve(String.valueOf(projectId));
        Path target = base.resolve(stored).normalize();
        if (!target.startsWith(base)) throw new IllegalArgumentException("안전하지 않은 파일 경로입니다.");
        boolean copied = false;
        try {
            Files.createDirectories(base);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            copied = true;
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("projectId", projectId);
            metadata.put("wikiPageId", wikiPageId);
            metadata.put("originalName", original);
            metadata.put("storedName", stored);
            metadata.put("filePath", target.toString());
            metadata.put("mimeType", file.getContentType());
            metadata.put("fileSize", Files.size(target));
            metadata.put("fileHash", sha256(target));
            mapper.insertAttachment(metadata);
        } catch (IOException | RuntimeException e) {
            if (copied) {
                try { Files.deleteIfExists(target); } catch (IOException ignored) { }
            }
            if (e instanceof RuntimeException runtimeException) throw runtimeException;
            throw new IllegalStateException("첨부파일 저장에 실패했습니다.", e);
        }
    }

    public Download load(Long projectId, Long attachmentId) {
        Map<String, Object> metadata = mapper.selectAttachment(projectId, attachmentId);
        if (metadata == null) throw new IllegalArgumentException("첨부파일을 찾을 수 없습니다.");
        Path allowed = Path.of(storageRoot).toAbsolutePath().normalize().resolve("attachments").resolve(String.valueOf(projectId));
        Path file = Path.of(String.valueOf(metadata.get("FILE_PATH"))).toAbsolutePath().normalize();
        if (!file.startsWith(allowed) || !Files.isRegularFile(file)) throw new IllegalArgumentException("첨부파일 경로가 유효하지 않습니다.");
        try {
            Resource resource = new UrlResource(file.toUri());
            return new Download(resource, String.valueOf(metadata.get("ORIGINAL_NAME")), String.valueOf(metadata.get("MIME_TYPE")));
        } catch (IOException e) {
            throw new IllegalStateException("첨부파일을 읽지 못했습니다.", e);
        }
    }

    @Transactional
    public void delete(Long projectId, Long attachmentId) {
        Map<String, Object> metadata = mapper.selectAttachment(projectId, attachmentId);
        if (metadata == null) return;
        Path allowed = Path.of(storageRoot).toAbsolutePath().normalize().resolve("attachments").resolve(String.valueOf(projectId));
        Path file = Path.of(String.valueOf(metadata.get("FILE_PATH"))).toAbsolutePath().normalize();
        if (!file.startsWith(allowed)) throw new IllegalArgumentException("첨부파일 경로가 유효하지 않습니다.");
        mapper.deleteAttachment(projectId, attachmentId);
        try { Files.deleteIfExists(file); } catch (IOException e) { throw new IllegalStateException("첨부파일 삭제에 실패했습니다.", e); }
    }

    private String cleanName(String name) {
        String clean = name == null ? "attachment" : Path.of(name).getFileName().toString().replaceAll("[\\r\\n]", "");
        if (clean.isBlank() || clean.equals(".") || clean.equals("..")) throw new IllegalArgumentException("파일명이 유효하지 않습니다.");
        return clean;
    }
    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot).replaceAll("[^A-Za-z0-9.]", "");
    }
    private String sha256(Path file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = new DigestInputStream(Files.newInputStream(file), digest)) { input.transferTo(java.io.OutputStream.nullOutputStream()); }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("파일 해시 생성에 실패했습니다.", e);
        }
    }
    public record Download(Resource resource, String filename, String mimeType) {}
}
