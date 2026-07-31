package com.aastudio.domain.code;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeVO {
    private Long id;
    private String groupCode;
    private String groupName;
    private String description;
    private String enabled;
}
