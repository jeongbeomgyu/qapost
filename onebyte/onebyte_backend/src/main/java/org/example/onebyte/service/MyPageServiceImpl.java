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

    //정보조회
    @Override
    @Transactional(readOnly = true)
    public MyPageInfoResponse getInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유저 없음"));
        return MyPageInfoResponse.from(user);
    }

    //이름, 닉네임변경
    @Override
    public void updateInfo(Long userId, UpdateInfoRequest request){
        User user = userRepository.findById(userId).orElseThrow(()->new AuthenticationFailedException("유저가 존재하지 않습니다."));

        // trim : 앞뒤공백날림
        String newName = (request.getName() == null || request.getName().isBlank()) ? user.getName() : request.getName().trim();
        String newNickname = (request.getNickname() == null || request.getNickname().isBlank()) ? user.getNickname() : request.getNickname().trim();

        //닉네임만 중복체크
        if (!newNickname.equals(user.getNickname())&& userRepository.existsByNickname(newNickname)) {
            throw DuplicateResourceException.userNickname(newNickname);
        }

        // 변경 없으면 종료
        if (newName.equals(user.getName()) && newNickname.equals(user.getNickname())) {
            return;
        }

        user.changeInfo(newName, newNickname);
    }

    //비밀번호 변경
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

    //회원탈퇴
    // MyPageServiceImpl.java
    @Override
    public void withdraw(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("사용자가 존재하지 않습니다."));

        if (UserStatus.WITHDRAWN_BY_USER.equals(user.getStatus())) {
            return; // 이미 탈퇴한 유저면 그냥 조용히 끝내도 됨(정책)
        }

        //isActive = false
        user.withdrawByUser();

        //refresh토큰 함께 압수
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardResponse> listMyBoards(Long userId, Pageable pageable) {
        return boardRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(BoardResponse::from)
                .getContent();
    }

    // 특정 사용자가 작성한 댓글 조회
    @Override
    public List<CommentResponse> listMyComments(Long userId, Pageable pageable) {
        return commentRepository.findMyComments(userId, pageable);
    }

}
