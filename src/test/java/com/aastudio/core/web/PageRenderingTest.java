package com.aastudio.core.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:page-rendering-tests;MODE=MariaDB;DB_CLOSE_DELAY=-1",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN"
})
class PageRenderingTest {
    @Value("${local.server.port}")
    private int port;

    @ParameterizedTest
    @ValueSource(strings = {"/", "/diagram", "/db-modeling", "/api", "/wiki", "/settings"})
    void rendersSharedNavigationFromClasspath(String path) throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                    .timeout(java.time.Duration.ofSeconds(15)).GET().build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode(), path);
            assertTrue(response.body().contains("class=\"app-navigation\""), path);
            assertTrue(response.body().contains("data-project-trigger"), path);
            assertTrue(response.body().contains("aria-current=\"page\""), path);
        }
    }
}
