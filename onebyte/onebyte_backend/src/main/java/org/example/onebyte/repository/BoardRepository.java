package org.example.onebyte.repository;

import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 카테고리 삭제할 때, 삭제한 카테고리의 Id 를 강제로 교체 시킴
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
       UPDATE Board b
       SET b.category.id = :etcId
       WHERE b.category.id = :targetId
       """)
    int updateCategoryBatch(@Param("targetId") Long targetId,
                            @Param("etcId") Long etcId);

    // 활성 카테고리 글만 조회 (native join)
    @Query("""
            select b
            from Board b
            join b.category c
            where c.isActive = true
            order by b.createdAt desc
            """)
    Page<Board> findAllVisibleBoards(Pageable pageable);

    // 카테고리별 조회 (활성 카테고리 + 특정 categoryId)
    @Query(
            value = """
            SELECT b.*
            FROM boards b
            JOIN categories c ON b.category_id = c.id
            WHERE c.is_active = true
              AND b.category_id = :categoryId
            ORDER BY b.created_at DESC
        """,
            countQuery = """
            SELECT COUNT(*)
            FROM boards b
            JOIN categories c ON b.category_id = c.id
            WHERE c.is_active = true
              AND b.category_id = :categoryId
        """,
            nativeQuery = true
    )
    Page<Board> findVisibleBoardsByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    // 제목 키워드 검색 (활성 키워드 + 제목 like 검색)
    // 빈 문자열 막기
    @Query(
            value = """
            SELECT b.*
            FROM boards b
            JOIN categorys c ON b.category_id = c.id
            WHERE c.is_active = true
              AND b.title LIKE CONCAT('%', :keyword, '%')
            ORDER BY b.created_at DESC
        """,
            countQuery = """
            SELECT COUNT(*)
            FROM boards b
            JOIN categorys c ON b.category_id = c.id
            WHERE c.is_active = true
              AND b.title LIKE CONCAT('%', :keyword, '%')
        """,
            nativeQuery = true
    )
    Page<Board> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    // 내 작성 게시물 찾기
    Page<Board> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // ----------
    // board 키워드 검색

    // 1. 제목 + 카테고리
    @Query(
            value = """
        SELECT b.*
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.title LIKE CONCAT('%', :q, '%')
        ORDER BY b.created_at DESC
    """,
            countQuery = """
        SELECT COUNT(*)
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.title LIKE CONCAT('%', :q, '%')
    """,
            nativeQuery = true
    )
    Page<Board> searchTitleByCategory(
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            Pageable pageable
    );

    // 2. 카테고리 + 내용
    @Query(
            value = """
        SELECT b.*
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.content LIKE CONCAT('%', :q, '%')
        ORDER BY b.created_at DESC
    """,
            countQuery = """
        SELECT COUNT(*)
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.content LIKE CONCAT('%', :q, '%')
    """,
            nativeQuery = true
    )
    Page<Board> searchContentByCategory(
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            Pageable pageable
    );

    // 3. 카테고리 + 제목 + 내용
    @Query(
            value = """
        SELECT b.*
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND (
              b.title LIKE CONCAT('%', :q, '%')
              OR b.content LIKE CONCAT('%', :q, '%')
          )
        ORDER BY b.created_at DESC
    """,
            countQuery = """
        SELECT COUNT(*)
        FROM boards b
        JOIN categories c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND (
              b.title LIKE CONCAT('%', :q, '%')
              OR b.content LIKE CONCAT('%', :q, '%')
          )
    """,
            nativeQuery = true
    )
    Page<Board> searchTitleOrContentByCategory(
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            Pageable pageable
    );

    // 카테고리 삭제 체크용
    // 삭제하고자 하는 카테고리에 글이 하나라도 있으면 삭제불가
    boolean existsByCategoryId(Long categoryId);

    /**
     * ✅ 소카테고리 삭제 정책 변경:
     * - 해당 소카테고리에 속한 게시글을 전부 하드 삭제한다.
     * - 주의: bulk delete 이므로, 연관 엔티티는 별도 정리(또는 DB cascade) 필요
     *   -> 본 프로젝트는 CommentRepository.deleteAllByCategoryId()로 댓글 먼저 삭제 후 호출한다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Board b where b.category.id = :categoryId")
    int deleteAllByCategoryId(@Param("categoryId") Long categoryId);

    @Query("""
           select (count(b) > 0)
           from Board b
           join b.category c
           where c.group.id = :groupId
           """)
    boolean existsByGroupId(@Param("groupId") Long groupId);

    void deleteByUserId(Long userId);

    // 동시성을 고려해서 엔티티 메서드 말고 쿼리로 원자적 처리
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Board b set b.commentCount = b.commentCount + 1 where b.id = :boardId")
    int increaseCommentCount(@Param("boardId") Long boardId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Board b 
        set b.commentCount = case when b.commentCount > 0 then b.commentCount - 1 else 0 end
        where b.id = :boardId
    """)
    int decreaseCommentCount(@Param("boardId") Long boardId);

    long countByUserId(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Board b set b.viewCount = b.viewCount + 1 where b.id = :boardId")
    int increaseViewCount(@Param("boardId") Long boardId);


    // 커뮤니티 현황 보드
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

}
