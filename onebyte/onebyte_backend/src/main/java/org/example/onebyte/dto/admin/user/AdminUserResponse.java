package org.example.onebyte.dto.admin.user;

import org.example.onebyte.entity.User;
import org.example.onebyte.type.UserStatus;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String nickname,
        String role,
        UserStatus status,
        String banReason,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole().name(),
                user.getStatus(),
                user.getBanReason(),
                user.getCreatedAt()
        );
    }
}
