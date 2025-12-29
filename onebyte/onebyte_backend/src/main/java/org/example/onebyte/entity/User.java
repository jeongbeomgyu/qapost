package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.onebyte.type.Role;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
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

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    //CREATED_AT, UPDATE_AT 자동 업데이트
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    //회원가입용 생성 메서드
    public static User createForRegister(String name, String  nickname, String email, String passwordHash) {
        return new User(
                null,
                name,
                nickname,
                email,
                passwordHash,
                Role.ROLE_USER,
                true,
                null,
                null
        );
    }

    //도메인 메서드
    public void changeInfo(String name, String nickname) {
        this.name = name;
        this.nickname = nickname;
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void deactivate() { // 회원 비활성화(삭제 대신)
        this.isActive = false;
    }

    //탈퇴회원 재가입을 위해
    public void activate() { this.isActive = true; }
}
