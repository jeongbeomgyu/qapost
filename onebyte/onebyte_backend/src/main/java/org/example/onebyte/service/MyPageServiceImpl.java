package org.example.onebyte.service;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.board.BoardResponse;
import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.dto.mypage.MyPageInfoResponse;
import org.example.onebyte.dto.mypage.UpdateInfoRequest;
import org.example.onebyte.dto.mypage.UpdatePasswordRequest;
import org.example.onebyte.entity.User;
import org.example.onebyte.exception.AuthenticationFailedException;
import org.example.onebyte.exception.DuplicateResourceException;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.CommentRepository;
import org.example.onebyte.repository.RefreshTokenRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.type.UserStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;

    // 정보조회 (+ postCount/commentCount/level 계산해서 내려줌)
    @Override
    @Transactional(readOnly = true)
    public MyPageInfoResponse getInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유저 없음"));

        long postCount = boardRepository.countByUserId(userId);
        long commentCount = commentRepository.countByUserId(userId);

        int level = calculateLevel(postCount, commentCount);


        return MyPageInfoResponse.from(user, postCount, commentCount, level);
    }


    // 이름, 닉네임, 자기소개, 웹사이트 변경
    @Override
    public void updateInfo(Long userId, UpdateInfoRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유저가 존재하지 않습니다."));

        String newName = (request.getName() == null || request.getName().isBlank())
                ? user.getName()
                : request.getName().trim();

        String newNickname = (request.getNickname() == null || request.getNickname().isBlank())
                ? user.getNickname()
                : request.getNickname().trim();

        if (!newNickname.equals(user.getNickname()) && userRepository.existsByNickname(newNickname)) {
            throw DuplicateResourceException.userNickname(newNickname);
        }

        String newBio = (request.getBio() == null || request.getBio().isBlank())
                ? user.getBio()
                : request.getBio().trim();

        String newWebsiteUrl = (request.getWebsiteUrl() == null || request.getWebsiteUrl().isBlank())
                ? user.getWebsiteUrl()
                : request.getWebsiteUrl().trim();

        boolean sameName = newName.equals(user.getName());
        boolean sameNickname = newNickname.equals(user.getNickname());
        boolean sameBio = (newBio == null ? user.getBio() == null : newBio.equals(user.getBio()));
        boolean sameWebsite = (newWebsiteUrl == null ? user.getWebsiteUrl() == null : newWebsiteUrl.equals(user.getWebsiteUrl()));

        if (sameName && sameNickname && sameBio && sameWebsite) return;

        user.changeInfo(newName, newNickname, newBio, newWebsiteUrl);
    }

    // 비밀번호 변경
    @Override
    public void updatePassword(Long userId, UpdatePasswordRequest req) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("존재하지 않는 사용자 입니다."));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("기존 비밀번호와 동일합니다.");
        }

        String newPasswordHash = passwordEncoder.encode(req.getNewPassword());
        user.changePasswordHash(newPasswordHash);
    }

    // 회원탈퇴
    @Override
    public void withdraw(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("사용자가 존재하지 않습니다."));

        if (UserStatus.WITHDRAWN_BY_USER.equals(user.getStatus())) return;

        user.withdrawByUser();
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardResponse> listMyBoards(Long userId, Pageable pageable) {
        return boardRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(BoardResponse::from)
                .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> listMyComments(Long userId, Pageable pageable) {
        return commentRepository
                .findMyComments(userId, pageable)
                .getContent();   // 🔥 여기
    }

    // 레벨 계산: 게시글*5 + 댓글 -> 1~5
    private int calculateLevel(long postCount, long commentCount) {
        long score = postCount * 5L + commentCount;

        // 네가 원하는 기준으로 바꾸면 됨. (일단 깔끔하게 5단계)
        if (score >= 300) return 5;
        if (score >= 150) return 4;
        if (score >= 70) return 3;
        if (score >= 20) return 2;
        return 1;
    }
}
