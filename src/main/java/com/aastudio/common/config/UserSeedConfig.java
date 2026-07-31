package com.aastudio.common.config;

import com.aastudio.domain.auth.AuthVO;
import com.aastudio.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class UserSeedConfig {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedAdminUser() {
        return args -> {
            if (userMapper.selectUserByUsername("admin") == null) {
                userMapper.insertAuthUser(AuthVO.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin1234"))
                        .roleName("ADMIN")
                        .enabled("Y")
                        .build());
            }
        };
    }
}
