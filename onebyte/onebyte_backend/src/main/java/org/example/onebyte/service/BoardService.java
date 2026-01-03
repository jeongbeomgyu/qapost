package org.example.onebyte.service;

import org.example.onebyte.dto.board.BoardRequest;
import org.example.onebyte.dto.board.BoardResponse;
import org.example.onebyte.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BoardService {
    Page<BoardResponse> list(Pageable pageable);

    // BoardId로 게시글 한건 조회
    BoardResponse findByBoardId(Long boardId);

    // 카테고리 별 게시글 조회
    Page<BoardResponse> getBoardsByCategory(Long categoryId, Pageable pageable);

    // 키워드 검색
    Page<BoardResponse> searchInCategory(Long categoryId, String q, String type, Pageable pageable);

    BoardResponse create(Long userId, BoardRequest request);

    BoardResponse update(Long boardId, Long userId, BoardRequest request);

    void delete(Long boardId, Long userId);


}
