package org.example.onebyte.dto.user;

import lombok.Builder;
import lombok.Getter;
import org.example.onebyte.entity.User;
import org.example.onebyte.type.Role;
import org.example.onebyte.type.UserStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String nickname;
    private String email;
    private Role role;
    private UserStatus status;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
