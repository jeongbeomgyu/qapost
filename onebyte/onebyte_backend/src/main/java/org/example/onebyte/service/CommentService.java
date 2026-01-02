package org.example.onebyte.service;


import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.comment.CommentRequest;
import org.example.onebyte.dto.comment.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {
    //특정 게시물의 댓글 조회 - 페이징
    Page<CommentResponse> listByBoard(Long boardId, Pageable pageable);

    //댓글 생성
    CommentResponse create(Long boardId, Long userId, CommentRequest request);

    //댓글 ID로 한건 조회 : 보류
    //CommentResponse getOne(Long commentId);

    //댓글 수정
    CommentResponse update(Long commentId, Long userId, CommentRequest request);

    //댓글 삭제
    void delete(Long commentId, Long userId);

    List<CommentResponse> listMyComments(Long userId, Pageable pageable);

}