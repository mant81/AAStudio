package com.aastudio.domain.project;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectVO {
    private Long id;
    private String name;
    private String description;
    private String rootPath;
    private String currentStage;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
