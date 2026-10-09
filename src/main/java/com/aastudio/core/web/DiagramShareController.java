package com.aastudio.core.web;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagram-shares")
public class DiagramShareController {

    private final ConcurrentMap<String, Map<String, Object>> shares = new ConcurrentHashMap<>();

    @PostMapping
    public ResponseEntity<Map<String, String>> createShare(@RequestBody Map<String, Object> state) {
        if (!(state.get("nodes") instanceof java.util.List<?>) || !(state.get("lines") instanceof java.util.List<?>)) {
            return ResponseEntity.badRequest().build();
        }

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        shares.put(token, state);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> getShare(@PathVariable String token) {
        Map<String, Object> state = shares.get(token);
        return state == null
                ? ResponseEntity.status(HttpStatus.NOT_FOUND).build()
                : ResponseEntity.ok(state);
    }
}
