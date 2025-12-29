package org.example.onebyte.dto.board;

import org.example.onebyte.entity.Board;

import java.time.LocalDateTime;

public record BoardResponse(
        Long id,
        Long categoryId,
        String title,
        String content,
        Long userId,
        Long viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static BoardResponse from(Board board) {
        return new BoardResponse(
                board.getId(),
                board.getCategoryId(),
                board.getTitle(),
                board.getContent(),
                board.getUserId(),
                board.getViewCount(),
                board.getCreatedAt(),
                board.getUpdatedAt()
        );
    }
}