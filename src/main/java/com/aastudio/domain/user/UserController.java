package com.aastudio.domain.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public String users(@RequestParam(value = "q", required = false) String q, Model model) {
        model.addAttribute("userCount", userService.getUserCount());
        model.addAttribute("query", q == null ? "" : q);
        model.addAttribute("users", userService.searchUsers(q));
        model.addAttribute("userForm", new UserVO());
        return "user/list";
    }

    @GetMapping("/users/{id}/edit")
    public String editUser(@PathVariable Long id, Model model) {
        model.addAttribute("userForm", userService.getUser(id));
        return "user/form";
    }

    @PostMapping("/users")
    public String createUser(@ModelAttribute("userForm") UserVO userVO) {
        userVO.setPassword(passwordEncoder.encode(userVO.getPassword()));
        userVO.setRoleName(normalizeRole(userVO.getRoleName()));
        userVO.setEnabled("Y");
        userService.createUser(userVO);
        return "redirect:/users";
    }

    @PostMapping("/users/{id}")
    public String updateUser(@PathVariable Long id, @ModelAttribute("userForm") UserVO userVO) {
        userVO.setId(id);
        if (userVO.getPassword() != null && !userVO.getPassword().isBlank()) {
            userVO.setPassword(passwordEncoder.encode(userVO.getPassword()));
        } else {
            userVO.setPassword(userService.getUser(id).getPassword());
        }
        userVO.setRoleName(normalizeRole(userVO.getRoleName()));
        userVO.setEnabled(userVO.getEnabled() == null || userVO.getEnabled().isBlank() ? "Y" : userVO.getEnabled());
        userService.updateUser(userVO);
        return "redirect:/users";
    }

    @PostMapping("/users/{id}/delete")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "redirect:/users";
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "READONLY" : role.trim().toUpperCase();
        return switch (normalized) {
            case "ADMIN", "OWNER", "EDITOR", "READONLY" -> normalized;
            default -> "READONLY";
        };
    }
}
