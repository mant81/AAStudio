package com.aastudio.mapper;

import com.aastudio.domain.code.CodeVO;
import java.util.List;

public interface CodeMapper {
    List<CodeVO> selectCodeGroupList();
    List<CodeVO> searchCodeGroupList(String keyword);
    CodeVO selectCodeGroupById(Long id);
    long countCodeGroups();
    int insertCodeGroup(CodeVO codeVO);
    int updateCodeGroup(CodeVO codeVO);
    int deleteCodeGroup(Long id);
}
