package com.aastudio.common.config;

import com.aastudio.mapper.WorkbenchMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AccessLogInterceptor implements HandlerInterceptor {
    private static final Pattern PROJECT_PATH = Pattern.compile("^/projects/(\\d+)(?:/([^/?]+))?.*$");
    private final WorkbenchMapper mapper;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Principal principal = request.getUserPrincipal();
        if (principal == null || response.getStatus() >= 500) return;
        Matcher matcher = PROJECT_PATH.matcher(request.getRequestURI());
        if (!matcher.matches()) return;
        try {
            Long projectId = Long.valueOf(matcher.group(1));
            String targetType = matcher.group(2) == null ? "project" : matcher.group(2);
            mapper.insertAccessLog(projectId, principal.getName(), request.getMethod(), targetType,
                    request.getRequestURI(), request.getRemoteAddr());
        } catch (RuntimeException ignored) {
            // Access logging must never make the user request fail.
        }
    }
}
