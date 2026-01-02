package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "comments",
        indexes = {
                @Index(name = "idx_comments_board_created", columnList = "board_id, created_at"),
                @Index(name = "idx_comments_user_created", columnList = "user_id, created_at")
        }
)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: boards.id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "board_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_comments_board")
    )
    private Board board;

    // FK: users.id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_comments_user")
    )
    private User user;

    // 비정규화: 조회용 닉네임(자주 쓰니까 저장)
    @Column(name = "user_nickname", nullable = false, length = 50)
    private String userNickname;

    @Column(nullable = false, length = 1000)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private Comment(Board board, User user, String userNickname, String content) {
        this.board = board;
        this.user = user;
        this.userNickname = userNickname;
        this.content = content;
    }

    public static Comment create(Board board, User user, String content) {
        // 생성 시점 닉네임 박제(= 과거 닉 유지 정책)
        return new Comment(board, user, user.getNickname(), content);
    }

    public void updateContent(String content) {
        this.content = content;
    }
}
