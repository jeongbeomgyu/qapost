package org.example.onebyte.dto.board;

import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.Category;

import java.time.LocalDateTime;

public record BoardResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String title,
        String content,
        Long userId,
        String userNickname,
        Long viewCount,
        Long commentCount,
        LocalDateTime createdAt
) {
    public static BoardResponse from(Board board) {
        return new BoardResponse(
                board.getId(),
                board.getCategory().getId(),
                board.getCategory().getName(),
                board.getTitle(),
                board.getContent(),
                board.getUserId(),
                board.getUserNickname(),
                board.getViewCount(),
                board.getCommentCount(),
                board.getCreatedAt()
        );
    }
}
