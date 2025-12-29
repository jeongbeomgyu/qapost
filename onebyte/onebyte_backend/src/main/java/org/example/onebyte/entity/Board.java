package org.example.onebyte.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    // FK: categorys.id (DDL상 테이블명 categorys지만 컬럼은 category_id)
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    // FK: users.id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    // DB에서 DEFAULT CURRENT_TIMESTAMP로 자동 세팅
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private LocalDateTime createdAt;

    // DB에서 ON UPDATE CURRENT_TIMESTAMP로 자동 갱신
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public static Board create(Long categoryId, Long userId, String title, String content) {
        return Board.builder()
                .categoryId(categoryId)
                .userId(userId)
                .title(title)
                .content(content)
                .viewCount(0L)
                .build();
    }

    public void update(Long categoryId, String title, String content) {
        this.categoryId = categoryId;
        this.title = title;
        this.content = content;
    }


    // 추후 개발
    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0L : this.viewCount) + 1L;
    }
}
