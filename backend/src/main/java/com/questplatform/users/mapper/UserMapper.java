package com.questplatform.users.mapper;

import com.questplatform.users.dto.UserResponse;
import com.questplatform.users.entity.Role;
import com.questplatform.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Маппер Entity ↔ DTO для пользователя.
 */
@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        List<String> roles = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream()
                .map(Role::getCode)
                .sorted()
                .toList();
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarKey(),
                user.getStatus(),
                user.getCreatedAt(),
                roles
        );
    }
}