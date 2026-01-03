
package org.example.onebyte.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.board.BoardRequest;
import org.example.onebyte.dto.board.BoardResponse;
import org.example.onebyte.security.JwtTokenizer;
import org.example.onebyte.service.BoardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardService boardService;
    private final JwtTokenizer jwtTokenizer;

    // 게시물 조회 : 모든 사람 가능
    @GetMapping
    public ResponseEntity<Page<BoardResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(boardService.list(pageable));
    }

    // 카테고리 별 조회 : 모든 사람 가능
    @GetMapping(params = "categoryId")
    public ResponseEntity<Page<BoardResponse>> getBoardsByCategory(
            @RequestParam Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(boardService.getBoardsByCategory(categoryId, pageable));
    }


    // 게시물 단건 조회 : 모든 사람 가능
    @GetMapping("/{boardId}")
    public ResponseEntity<BoardResponse> findByBoardId(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.findByBoardId(boardId));
    }

    // 키워드 검색
    // q : 키워드
    // LIKE '%키워드%'문 사용
    @GetMapping("/search")
    public ResponseEntity<Page<BoardResponse>> searchInCategory(
            @RequestParam Long categoryId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "all") String type, // title | content | all
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(boardService.searchInCategory(categoryId, keyword, type, pageable));
    }


    // 게시물 작성 : 로그인한 사람만
    @PostMapping("")
    public ResponseEntity<BoardResponse> create(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody BoardRequest request
    ) {
        Long userId = jwtTokenizer.getUserIdFromToken(authorization);
        BoardResponse response = boardService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response); // 201
    }

    // 게시물 수정 : 작성자만 (제목/내용/카테고리 변경 가능)
    @PatchMapping ("/{boardId}")
    public ResponseEntity<BoardResponse> update(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long boardId,
            @Valid @RequestBody BoardRequest request
    ) {
        Long userId = jwtTokenizer.getUserIdFromToken(authorization);
        BoardResponse response = boardService.update(boardId, userId, request);
        return ResponseEntity.ok(response);
    }


    // 게시물 삭제 : 작성자 또는 관리자
    @DeleteMapping("/{boardId}")
    public ResponseEntity<MessageResponse> delete(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long boardId
    ) {
        Long userId = jwtTokenizer.getUserIdFromToken(authorization);
        boardService.delete(boardId, userId);
        return ResponseEntity.ok(new MessageResponse("게시글 삭제가 완료되었습니다.")); // 204
    }



}
