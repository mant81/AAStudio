package com.aastudio.domain.code;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class CodeController {

    private final CodeService codeService;

    @GetMapping("/code-groups")
    public String list(@RequestParam(value = "q", required = false) String q, Model model) {
        model.addAttribute("codeGroupCount", codeService.getCodeGroupCount());
        model.addAttribute("query", q == null ? "" : q);
        model.addAttribute("codeGroups", codeService.searchCodeGroups(q));
        model.addAttribute("codeGroupForm", new CodeVO());
        return "code/group-list";
    }

    @GetMapping("/code-groups/{id}/edit")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("codeGroupForm", codeService.getCodeGroup(id));
        return "code/group-form";
    }

    @PostMapping("/code-groups")
    public String create(@ModelAttribute("codeGroupForm") CodeVO codeVO) {
        if (codeVO.getEnabled() == null || codeVO.getEnabled().isBlank()) {
            codeVO.setEnabled("Y");
        }
        codeService.createCodeGroup(codeVO);
        return "redirect:/code-groups";
    }

    @PostMapping("/code-groups/{id}")
    public String update(@PathVariable Long id, @ModelAttribute("codeGroupForm") CodeVO codeVO) {
        codeVO.setId(id);
        if (codeVO.getEnabled() == null || codeVO.getEnabled().isBlank()) {
            codeVO.setEnabled("Y");
        }
        codeService.updateCodeGroup(codeVO);
        return "redirect:/code-groups";
    }

    @PostMapping("/code-groups/{id}/delete")
    public String delete(@PathVariable Long id) {
        codeService.deleteCodeGroup(id);
        return "redirect:/code-groups";
    }
}
