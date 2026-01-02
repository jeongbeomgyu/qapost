package org.example.onebyte.dto.mypage;

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
    private String bio;
    private String websiteUrl;

    private Role role;
    private UserStatus userStatus;

    private long postCount;
    private long commentCount;
    private int level;

    // 기존 from(User) 유지: 다른 코드 안 깨지게 기본값 세팅(안전빵)
    public static MyPageInfoResponse from(User user) {
        return new MyPageInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getBio(),
                user.getWebsiteUrl(),
                user.getRole(),
                user.getStatus(),
                0L,
                0L,
                1
        );
    }

    // 마이페이지 조회용: count + level 포함
    public static MyPageInfoResponse from(User user, long postCount, long commentCount, int level) {
        return new MyPageInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getBio(),
                user.getWebsiteUrl(),
                user.getRole(),
                user.getStatus(),
                postCount,
                commentCount,
                level
        );
    }
}
