package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.onebyte.type.Role;
import org.example.onebyte.type.UserStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String nickname;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;


    @Column(name = "ban_reason")
    private String banReason;

    // 바이오그래피, 웹사이트 url 추가
    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    @Column(nullable = false)
    @Builder.Default
    private int level = 1;

    //CREATED_AT, UPDATE_AT 자동 업데이트
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public User(
            Long id,
            String name,
            String nickname,
            String email,
            String passwordHash,
            Role role,
            UserStatus status,
            String banReason
    ) {
        this.id = id;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.banReason = banReason;
    }

    //회원가입용 생성 메서드
    public static User createForRegister(String name, String nickname, String email, String passwordHash) {
        return User.builder()
                .name(name.trim())
                .nickname(nickname.trim())
                .email(email.trim())
                .passwordHash(passwordHash)
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .level(1)
                .banReason(null)
                .build();
    }



    // 도메인 메서드
    public void changeInfo(String name, String nickname, String bio, String websiteUrl) {
        this.name = name;
        this.nickname = nickname;
        this.bio = bio;
        this.websiteUrl = websiteUrl;
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }


    // status 관련 도메인
    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    // 사용자 직접 탈퇴
    public void withdrawByUser() {
        this.status = UserStatus.WITHDRAWN_BY_USER;
    }

    // 관리자에 의한 차단
    public void banByAdmin(String reason) {
        this.status = UserStatus.BANNED_BY_ADMIN;
        this.banReason = reason;
    }

    // 관리자에 의한 차단 해제
    public void unbanToWithdrawn() {
        this.status = UserStatus.WITHDRAWN_BY_USER;
        this.banReason = null;
    }

    // 사용자 재가입
    public void reactivate(String email, String nicknamem, String passwordHash) {
        this.status = UserStatus.ACTIVE;
        this.email = email;
        this.nickname = nicknamem;
        this.passwordHash = passwordHash;
    }
}
