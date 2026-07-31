package com.aastudio.mapper;

import com.aastudio.domain.auth.AuthVO;
import com.aastudio.domain.user.UserVO;
import java.util.List;

public interface UserMapper {
    AuthVO selectUserByUsername(String username);
    int insertAuthUser(AuthVO authVO);

    List<UserVO> selectUserList();
    List<UserVO> searchUserList(String keyword);
    UserVO selectUserById(Long id);
    long countUsers();
    int insertUser(UserVO userVO);
    int updateUser(UserVO userVO);
    int deleteUser(Long id);
}
