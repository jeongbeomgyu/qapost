package org.example.onebyte.service.admin;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.entity.User;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.CommentRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.type.UserStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;

    /**
     * 관리자 차단
     * - status = BANNED_BY_ADMIN
     * - banReason 저장
     * - 게시글 / 댓글 삭제
     */
    @Transactional
    public void banUser(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if (user.getStatus() == UserStatus.BANNED_BY_ADMIN) {
            return; // 이미 차단됨 → 그냥 무시 (또는 예외)
        }

        user.banByAdmin(reason);

        // 🔥 요구사항: 관리자 차단 시 게시글/댓글 삭제
        commentRepository.deleteByUserId(userId);
        boardRepository.deleteByUserId(userId);
    }

    /**
     * 관리자 차단 해제
     * - status = WITHDRAWN_BY_USER
     * - 재가입 가능 상태로 전환
     */
    @Transactional
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if (user.getStatus() != UserStatus.BANNED_BY_ADMIN) {
            return; // 차단 상태가 아니면 아무 것도 안 함
        }

        user.unbanToWithdrawn();
    }
}
