package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "category_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_boards_category")
    )
    private Category category;

    @OneToMany(
            mappedBy = "board",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true
    )
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_nickname", nullable = false, length = 50)
    private String userNickname;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private Long commentCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Board create(Category category, Long userId, String userNickname, String title, String content) {
        return Board.builder()
                .category(category)
                .userId(userId)
                .userNickname(userNickname)
                .title(title)
                .content(content)
                .viewCount(0L)
                .commentCount(0L)
                .build();
    }

    public void update(Category category, String title, String content) {
        this.category = category;
        this.title = title;
        this.content = content;
    }

    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0L : this.viewCount) + 1L;
    }

    public void increaseCommentCount() {
        this.commentCount = (this.commentCount == null ? 0L : this.commentCount) + 1L;
    }

    public void decreaseCommentCount() {
        long cur = (this.commentCount == null ? 0L : this.commentCount);
        this.commentCount = Math.max(0L, cur - 1L);
    }
}
