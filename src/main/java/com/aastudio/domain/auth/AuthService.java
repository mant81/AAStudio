package com.aastudio.domain.auth;

import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.aastudio.mapper.UserMapper;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserMapper userMapper;

    public AuthVO findByUsername(String username) {
        return userMapper.selectUserByUsername(username);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.aastudio.domain.auth.AuthVO userVO = findByUsername(username);
        if (userVO == null || !"Y".equalsIgnoreCase(userVO.getEnabled())) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + userVO.getRoleName().toUpperCase());
        return new User(userVO.getUsername(), userVO.getPassword(), Collections.singleton(authority));
    }
}
