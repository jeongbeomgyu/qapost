package org.example.onebyte.dto.comment;

import org.example.onebyte.entity.Comment;

import java.time.LocalDateTime;

// 닉네임까지 반환
public record CommentResponse(
        Long id,
        Long boardId,
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
                comment.getUser().getId(),
                comment.getUser().getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
