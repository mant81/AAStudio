package com.aastudio.domain.code;

import com.aastudio.mapper.CodeMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CodeService {

    private final CodeMapper codeMapper;

    public List<CodeVO> getCodeGroupList() {
        return codeMapper.selectCodeGroupList();
    }

    public List<CodeVO> searchCodeGroups(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getCodeGroupList();
        }
        return codeMapper.searchCodeGroupList(keyword.trim());
    }

    public CodeVO getCodeGroup(Long id) {
        return codeMapper.selectCodeGroupById(id);
    }

    public long getCodeGroupCount() {
        return codeMapper.countCodeGroups();
    }

    public void createCodeGroup(CodeVO codeVO) {
        codeMapper.insertCodeGroup(codeVO);
    }

    public void updateCodeGroup(CodeVO codeVO) {
        codeMapper.updateCodeGroup(codeVO);
    }

    public void deleteCodeGroup(Long id) {
        codeMapper.deleteCodeGroup(id);
    }
}
