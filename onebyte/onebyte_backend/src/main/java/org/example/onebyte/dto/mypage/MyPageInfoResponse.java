package org.example.onebyte.dto.mypage;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.example.onebyte.entity.User;
import org.example.onebyte.type.Role;

@Getter
@AllArgsConstructor
public class MyPageInfoResponse {
    private Long id;
    private String email;
    private String name;
    private String nickname;
    private Role role;
    private Boolean isActive;

    public static MyPageInfoResponse from(User user) {
        return new MyPageInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole(),
                user.getIsActive()
        );
    }
}
