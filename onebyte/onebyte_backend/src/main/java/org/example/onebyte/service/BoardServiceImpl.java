package org.example.onebyte.service;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.board.BoardRequest;
import org.example.onebyte.dto.board.BoardResponse;
import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.Category;
import org.example.onebyte.entity.User;
import org.example.onebyte.exception.PostNotFoundException;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.repository.category.CategoryRepository;
import org.example.onebyte.type.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponse> list(Pageable pageable) {
        // "활성 카테고리 글만" 정책이면 아래로 바꿔
        return boardRepository.findAllVisibleBoards(pageable).map(BoardResponse::from);

        // 전체 조회면 기존 findAll 써도 됨
        // return boardRepository.findAll(pageable).map(BoardResponse::from);
    }

    @Override
    public BoardResponse findByBoardId(Long boardId) {
        boardRepository.increaseViewCount(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));

        return BoardResponse.from(board);
    }


    // 카테고리 별 게시글 조회
    public Page<BoardResponse> getBoardsByCategory(Long categoryId, Pageable pageable){
        if (categoryId == null) {
            throw new IllegalArgumentException("categoryId는 필수입니다.");
        }

        return boardRepository.findVisibleBoardsByCategoryId(categoryId, pageable)
                .map(BoardResponse::from);
    }

    // 키워드 검색
    // 무조건 카테고리 아이디도 필요
    @Override
    public Page<BoardResponse> searchInCategory(Long categoryId, String q, String type, Pageable pageable) {
        if (categoryId == null) {
            throw new IllegalArgumentException("categoryId는 필수입니다.");
        }
        if (q == null || q.trim().isEmpty()) {
            throw new IllegalArgumentException("키워드는 필수입니다.");
        }

        String keyword = q.trim();

        Page<Board> result = switch (type.toLowerCase()) {
            case "title" -> boardRepository.searchTitleByCategory(categoryId, keyword, pageable);
            case "content" -> boardRepository.searchContentByCategory(categoryId, keyword, pageable);
            case "all" -> boardRepository.searchTitleOrContentByCategory(categoryId, keyword, pageable);
            default -> throw new IllegalArgumentException("type은 title/content/all 중 하나여야 합니다.");
        };

        return result.map(BoardResponse::from);
    }


    @Override
    public BoardResponse create(Long userId, BoardRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 없습니다. id=" + userId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));

        if (user.getNickname() == null || user.getNickname().isBlank()) {
            throw new IllegalStateException("유저 닉네임이 비어있습니다. userId=" + userId);
        }

        Board board = Board.builder()
                .category(category)
                .title(request.title())
                .content(request.content())
                .userId(user.getId())
                .userNickname(user.getNickname())
                .viewCount(0L)
                .commentCount(0L)
                .build();

        return BoardResponse.from(boardRepository.save(board));
    }


    @Override
    public BoardResponse update(Long boardId, Long userId, BoardRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new PostNotFoundException(boardId));

        if (!board.getUserId().equals(userId)) {
            throw new AccessDeniedException("작성자만 수정할 수 있습니다.");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));

        board.update(category, request.title(), request.content());
        return BoardResponse.from(board);
    }

    @Override
    public void delete(Long boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new PostNotFoundException(boardId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 없습니다. id=" + userId));

        boolean isAuthor = board.getUserId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("작성자 또는 관리자만 삭제할 수 있습니다.");
        }

        boardRepository.delete(board);
    }


}
