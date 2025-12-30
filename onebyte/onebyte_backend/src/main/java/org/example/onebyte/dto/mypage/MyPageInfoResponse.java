package org.example.onebyte.dto.mypage;

import ch.qos.logback.core.status.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.example.onebyte.entity.User;
import org.example.onebyte.type.Role;
import org.example.onebyte.type.UserStatus;

@Getter
@AllArgsConstructor
public class MyPageInfoResponse {
    private Long id;
    private String email;
    private String name;
    private String nickname;
    private Role role;
    private UserStatus userStatus;

    public static MyPageInfoResponse from(User user) {
        return new MyPageInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole(),
                user.getStatus()
        );
    }
}
