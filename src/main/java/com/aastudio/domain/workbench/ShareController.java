package com.aastudio.domain.workbench;

import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class ShareController {
    private final ShareService shareService;
    private final AttachmentService attachmentService;

    @PostMapping("/projects/{projectId}/workbench/shares")
    public String create(@PathVariable Long projectId, @RequestParam(required=false) String label,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime expiresAt,
                         @RequestParam(required=false) String allowDownload, Principal principal,
                         RedirectAttributes redirectAttributes) {
        String token = shareService.create(projectId, label, expiresAt,
                "Y".equalsIgnoreCase(allowDownload), principal.getName());
        redirectAttributes.addFlashAttribute("generatedSharePath", "/share/" + token);
        return redirect(projectId);
    }

    @PostMapping("/projects/{projectId}/workbench/shares/{shareId}/revoke")
    public String revoke(@PathVariable Long projectId, @PathVariable Long shareId) {
        shareService.revoke(projectId, shareId);
        return redirect(projectId);
    }

    @GetMapping("/share/{token}")
    public String view(@PathVariable String token, Model model, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        ShareService.SharedProject shared = shareService.resolve(token);
        model.addAttribute("shared", shared);
        model.addAttribute("shareToken", token);
        return "share/view";
    }

    @GetMapping("/share/{token}/attachments/{attachmentId}")
    public ResponseEntity<Resource> download(@PathVariable String token, @PathVariable Long attachmentId) {
        Long projectId = shareService.downloadableProject(token);
        AttachmentService.Download download = attachmentService.load(projectId, attachmentId);
        MediaType mediaType;
        try { mediaType = MediaType.parseMediaType(download.mimeType()); }
        catch (Exception ignored) { mediaType = MediaType.APPLICATION_OCTET_STREAM; }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(mediaType)
                .header("Referrer-Policy", "no-referrer")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(download.filename(), StandardCharsets.UTF_8).build().toString())
                .body(download.resource());
    }

    private String redirect(Long projectId) {
        return "redirect:/projects/" + projectId + "/workbench?tab=share";
    }
}
