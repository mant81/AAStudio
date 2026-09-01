package com.aastudio.core.web;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class LayoutModelFactory {

    @ModelAttribute("navigationItems")
    public List<Map<String, String>> navigationItems() {
        return List.of();
    }
}
