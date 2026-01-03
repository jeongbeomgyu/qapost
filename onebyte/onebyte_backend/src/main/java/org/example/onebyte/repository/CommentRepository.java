package org.example.onebyte.repository;

import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    //리턴 타입 : 성능 최적화, UX때문
    Page<Comment> findByBoard_Id(Long boardId, Pageable pageable);

    // 유저id로 작성한 댓글 모두 조회
    // 유저id로 작성한 댓글 모두 조회 (페이징)
    @Query("""
    select new org.example.onebyte.dto.comment.CommentResponse(
        c.id,
        b.id,
        b.title,
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
    Page<CommentResponse> findMyComments(@Param("userId") Long userId, Pageable pageable);



    /**
     * ✅ 소카테고리 삭제 정책 변경:
     * - 해당 소카테고리에 속한 게시글들의 댓글을 먼저 전부 삭제한다.
     * - bulk delete 이므로 호출부(@Transactional)에서 트랜잭션 보장 필요
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from Comment c
        where c.board.id in (
            select b.id from Board b where b.category.id = :categoryId
        )
        """)
    int deleteAllByCategoryId(@Param("categoryId") Long categoryId);

    void deleteByUserId(Long userId);

    long countByUserId(Long userId);
}