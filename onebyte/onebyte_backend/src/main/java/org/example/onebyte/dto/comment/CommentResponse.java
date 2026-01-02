package org.example.onebyte.dto.comment;

import org.example.onebyte.entity.Comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long boardId,
        String boardTitle,      // ✅ 추가
        Long userId,
        String userNickname,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getBoard().getId(),
                comment.getBoard().getTitle(),     // ✅ 추가
                comment.getUser().getId(),
                comment.getUserNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
