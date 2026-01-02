package org.example.onebyte.service;


import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.comment.CommentRequest;
import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.Comment;
import org.example.onebyte.entity.User;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.CommentRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.type.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final BoardRepository boardRepository;

    //댓글 조회 - 페이징
    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> listByBoard(Long boardId, Pageable pageable) {
        Page<Comment> page = commentRepository.findByBoard_Id(boardId, pageable);
        return page.map(CommentResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> listMyComments(Long userId, Pageable pageable) {
        return commentRepository.findMyComments(userId, pageable).getContent();
    }


    //댓글 생성
    @Override
    public CommentResponse create(Long boardId, Long userId, CommentRequest request) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 없습니다. id=" + boardId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 없습니다. id=" + userId));

        Comment comment = Comment.create(board, user, request.content());
        Comment saved = commentRepository.save(comment);

        boardRepository.increaseCommentCount(boardId);

        return CommentResponse.from(saved);
    }

    //댓글 수정
    @Override
    public CommentResponse update(Long commentId, Long userId, CommentRequest request){
        Comment comment = commentRepository.findById(commentId).orElseThrow(()->new IllegalArgumentException("댓글이 존재하지않습니다."));

        // 작성자 검증
        if(!comment.getUser().getId().equals(userId)){
            throw new AccessDeniedException("작성자만 수정할 수 있습니다.");
        }

        comment.updateContent(request.content());

        return CommentResponse.from(comment);
    }

    //댓글 삭제
    @Override
    public void delete(Long commentId, Long userId){
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        boolean isAuthor = comment.getUser().getId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN; // 너 프로젝트 Role 이름 맞춰

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("작성자 또는 관리자만 삭제할 수 있습니다.");
        }

        boardRepository.decreaseCommentCount(commentId);

        commentRepository.delete(comment);
    }

    //댓글 ID로 한건 조회 : 보류
    //@Override
    //public CommentResponse getOne(Long commentId);


}
