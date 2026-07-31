package com.aastudio.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.security.core.Authentication;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ModelAttribute("canEdit")
    public boolean canEdit(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().matches("ROLE_(ADMIN|OWNER|EDITOR)"));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String badRequest(IllegalArgumentException exception, HttpServletRequest request,
                             HttpServletResponse response, Model model) {
        model.addAttribute("status", 400);
        model.addAttribute("message", exception.getMessage());
        model.addAttribute("path", safePath(request, response));
        return "error";
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String applicationError(IllegalStateException exception, HttpServletRequest request,
                                   HttpServletResponse response, Model model) {
        model.addAttribute("status", 500);
        model.addAttribute("message", exception.getMessage());
        model.addAttribute("path", safePath(request, response));
        return "error";
    }

    private String safePath(HttpServletRequest request, HttpServletResponse response) {
        String path = request.getRequestURI();
        if (path.startsWith("/share/")) {
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            response.setHeader("Referrer-Policy", "no-referrer");
            return "/share/[redacted]";
        }
        return path;
    }
}
