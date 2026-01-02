package org.example.onebyte.service.admin;

import org.example.onebyte.dto.admin.user.AdminUserResponse;

import java.util.List;

public interface AdminUserService {

    /**
     * 관리자 차단
     * - status = BANNED_BY_ADMIN
     * - banReason 저장
     * - 게시글 / 댓글 삭제
     */
    void banUser(Long userId, String reason);

    /**
     * 관리자 차단 해제
     * - status = WITHDRAWN_BY_USER
     * - 재가입 가능 상태로 전환
     */
    void unbanUser(Long userId);

    // 사용자 상태에 따라 조회
    List<AdminUserResponse> findAll();
    List<AdminUserResponse> findActive();
    List<AdminUserResponse> findBanned();
    List<AdminUserResponse> findWithdrawn();}
