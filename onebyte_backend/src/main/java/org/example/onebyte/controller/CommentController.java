package org.example.onebyte.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.comment.CommentRequest;
import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.security.CustomUserDetails;
import org.example.onebyte.service.CommentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    // 댓글 조회 (모두 가능)
    @GetMapping("/boards/{boardId}/comments")
    public ResponseEntity<Page<CommentResponse>> list(
            @PathVariable Long boardId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(commentService.listByBoard(boardId, pageable));
    }

    // 댓글 생성 (로그인 필요)
    @PostMapping("/boards/{boardId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long boardId,
            @Valid @RequestBody CommentRequest request
    ) {
        CommentResponse res = commentService.create(boardId, user.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // 댓글 수정 (작성자만)
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request
    ) {
        CommentResponse res = commentService.update(commentId, user.getUserId(), request);
        return ResponseEntity.ok(res);
    }

    // 댓글 삭제 (작성자 or 관리자)
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<MessageResponse> deleteComment(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long commentId
    ) {
        commentService.delete(commentId, user.getUserId());
        return ResponseEntity.ok(new MessageResponse("댓글 삭제가 완료되었습니다."));
    }
}
