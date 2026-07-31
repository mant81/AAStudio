package com.aastudio.domain.user;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.aastudio.mapper.UserMapper;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public List<UserVO> getUserList() {
        return userMapper.selectUserList();
    }

    public List<UserVO> searchUsers(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getUserList();
        }
        return userMapper.searchUserList(keyword.trim());
    }

    public UserVO getUser(Long id) {
        return userMapper.selectUserById(id);
    }

    public long getUserCount() {
        return userMapper.countUsers();
    }

    public void createUser(UserVO userVO) {
        userMapper.insertUser(userVO);
    }

    public void updateUser(UserVO userVO) {
        userMapper.updateUser(userVO);
    }

    public void deleteUser(Long id) {
        userMapper.deleteUser(id);
    }
}
