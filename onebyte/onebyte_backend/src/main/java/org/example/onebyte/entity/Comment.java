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
@Table(name = "comments",
        indexes = {
                @Index(name = "idx_comments_board_created", columnList = "board_id, created_at"),
                @Index(name = "idx_comments_user_created", columnList = "user_id, created_at")
        })
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // boardId, userId 사용 x, 객체로 직접 선언
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 1000)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private Comment(Board board, User user, String content) {
        this.board = board;
        this.user = user;
        this.content = content;
    }

    public static Comment create(Board board, User user, String content) {
        return new Comment(board, user, content);
    }

    public void updateContent(String content) {
        this.content = content;
    }
}
