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

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 카테고리 삭제할 때, 삭제한 카테고리의 Id 를 강제로 교체 시킴
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Board b SET b.categoryId = :etcId WHERE b.categoryId = :targetId")
    void updateCategoryBatch(@Param("targetId") Long targetId, @Param("etcId") Long etcId);


    // 활성 카테고리 글만 조회 (native join)
    @Query(
            value = """
                SELECT b.*
                FROM boards b
                JOIN categorys c ON b.category_id = c.id
                WHERE c.is_active = true
            """,
            countQuery = """
                SELECT COUNT(*)
                FROM boards b
                JOIN categorys c ON b.category_id = c.id
                WHERE c.is_active = true
            """,
            nativeQuery = true
    )
    Page<Board> findAllVisibleBoards(Pageable pageable);

    // 카테고리별 조회 (활성 카테고리 + 특정 categoryId)
    @Query(
            value = """
            SELECT b.*
            FROM boards b
            JOIN categorys c ON b.category_id = c.id
            WHERE c.is_active = true
              AND b.category_id = :categoryId
            ORDER BY b.created_at DESC
        """,
            countQuery = """
            SELECT COUNT(*)
            FROM boards b
            JOIN categorys c ON b.category_id = c.id
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
        JOIN categorys c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.title LIKE CONCAT('%', :q, '%')
        ORDER BY b.created_at DESC
    """,
            countQuery = """
        SELECT COUNT(*)
        FROM boards b
        JOIN categorys c ON b.category_id = c.id
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
        JOIN categorys c ON b.category_id = c.id
        WHERE c.is_active = true
          AND b.category_id = :categoryId
          AND b.content LIKE CONCAT('%', :q, '%')
        ORDER BY b.created_at DESC
    """,
            countQuery = """
        SELECT COUNT(*)
        FROM boards b
        JOIN categorys c ON b.category_id = c.id
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
        JOIN categorys c ON b.category_id = c.id
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
        JOIN categorys c ON b.category_id = c.id
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



}
