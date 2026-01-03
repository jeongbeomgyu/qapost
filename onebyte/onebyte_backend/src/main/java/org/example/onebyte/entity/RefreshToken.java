package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE) // ✅ 외부에서 막 new 못하게
@Builder(access = AccessLevel.PRIVATE)             // ✅ create()로만 만들게
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ 유저당 1개
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 500)
    private String token;

    // 만료기간
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // 생성기간 (DB에서 default로 채우는 경우)
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // 생성 팩토리 (로그인 시 저장할 때 사용)
    public static RefreshToken create(User user, String token, LocalDateTime expiresAt) {
        return RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .build();
    }

    // 재발급 시 롤링/갱신용
    public void rotate(String newToken, LocalDateTime newExpiresAt) {
        this.token = newToken;
        this.expiresAt = newExpiresAt;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }
}
