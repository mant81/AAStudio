package com.aastudio.domain.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthVO {
    private Long id;
    private String username;
    private String password;
    private String roleName;
    private String enabled;
}
