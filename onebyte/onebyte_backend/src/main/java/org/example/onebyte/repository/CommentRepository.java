package org.example.onebyte.repository;

import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    //리턴 타입 : 성능 최적화, UX때문
    Page<Comment> findByBoard_Id(Long boardId, Pageable pageable);

    // 유저id로 작성한 댓글 모두 조회
    @Query("""
        select new org.example.onebyte.dto.comment.CommentResponse(
            c.id,
            b.id,
            u.id,
            u.nickname,
            c.content,
            c.createdAt,
            c.updatedAt
        )
        from Comment c
        join c.board b
        join c.user u
        where u.id = :userId
        order by c.createdAt desc
    """)
    List<CommentResponse> findMyComments(@Param("userId") Long userId, Pageable pageable);
}