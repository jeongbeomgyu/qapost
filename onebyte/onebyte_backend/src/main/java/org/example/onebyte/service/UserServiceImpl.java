package org.example.onebyte.service;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.user.*;
import org.example.onebyte.entity.RefreshToken;
import org.example.onebyte.entity.User;
import org.example.onebyte.exception.AuthenticationFailedException;
import org.example.onebyte.exception.DuplicateResourceException;
import org.example.onebyte.repository.RefreshTokenRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.security.JwtTokenizer;
import org.example.onebyte.type.UserStatus;
import org.example.onebyte.util.CookieUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
//표준 클래임
import io.jsonwebtoken.Claims;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CookieUtil cookieUtil;
    private final JwtTokenizer jwtTokenizer;

    //추후 변경가능
    private long refreshMaxAgeSeconds = 24 * 60 * 60L;

    // 회원가입
    @Override
    public MessageResponse register(RegisterRequest request) {

        User existing = userRepository.findByEmail(request.getEmail()).orElse(null);

        // 이미 ACTIVE면 중복
        if (existing != null && existing.getStatus() == UserStatus.ACTIVE) {
            throw DuplicateResourceException.userEmail(request.getEmail());
        }

        // 닉네임 중복 체크
        if (existing == null) {
            if (userRepository.existsByNickname(request.getNickname())) {
                throw DuplicateResourceException.userNickname(request.getNickname());
            }
        } else {
            // 차단 유저는 재가입 불가
            if (existing.getStatus() == UserStatus.BANNED_BY_ADMIN) {
                throw new AuthenticationFailedException("차단된 회원은 재가입할 수 없습니다.");
            }

            // WITHDRAWN 복구 시 닉네임 충돌 검사
            if (userRepository.existsByNicknameAndIdNot(
                    request.getNickname(),
                    existing.getId()
            )) {
                throw DuplicateResourceException.userNickname(request.getNickname());
            }
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());

        // 신규 가입
        if (existing == null) {
            User user = User.createForRegister(
                    request.getName(),
                    request.getNickname(),
                    request.getEmail(),
                    passwordHash
            );
            userRepository.save(user);
            return new MessageResponse("회원가입을 완료합니다.");
        }

        // 탈퇴 유저 복구 (WITHDRAWN → ACTIVE)
        existing.reactivate(
                request.getName().trim(),
                request.getNickname().trim(),
                passwordHash
        );

        return new MessageResponse("회원가입을 완료합니다.");
    }


    // 로그인
    @Override
    public TokenResponse login(LoginRequest request, HttpServletResponse response) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다."));

        // 비활성 유저도 로그인 실패(메시지 통일)
        if (UserStatus.WITHDRAWN_BY_USER.equals(user.getStatus())) {
            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        else if (UserStatus.BANNED_BY_ADMIN.equals(user.getStatus())){
            throw new AuthenticationFailedException("관리자에 의해 차단당한 사용자 입니다.");
        }

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 토큰 생성
        String accessToken = jwtTokenizer.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        String refreshToken = jwtTokenizer.createRefreshToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        refreshTokenRepository.deleteByUserId(user.getId());
        // 충돌 방지
        refreshTokenRepository.flush();

        //추후 DB에서 직접 createdAt 생성될때 거기서 자동 할당 되는 방법 없는지 고려
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshMaxAgeSeconds))
                .build();

        refreshTokenRepository.save(rt);

        // refreshToken 쿠키 세팅 (CookieUtil 사용)
        // **** 로그인 응답에 Set-Cookie  보냄
        cookieUtil.addRefreshTokenCookie(response, refreshToken, refreshMaxAgeSeconds);

        // 바디에는 accessToken만 내려줌
        return new TokenResponse(accessToken);
    }


    // 로그아웃(DB refresh 삭제 + 쿠키 만료)
    @Transactional
    public ResponseEntity<MessageResponse> logout(String authorization, HttpServletResponse response) {

        // 1) accessToken에서 userId 추출
        Long userId = jwtTokenizer.getUserIdFromToken(authorization);

        // 2) DB refreshToken 삭제 (유저 기준)
        refreshTokenRepository.deleteByUserId(userId);

        // 3) 쿠키 만료
        cookieUtil.expireRefreshTokenCookie(response);

        return ResponseEntity.ok(new MessageResponse("로그아웃이 되었습니다."));
    }

    //토큰 재발급
    @Override
    public TokenResponse reissue(String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AuthenticationFailedException("refreshToken이 없습니다.");
        }

        Claims claims = jwtTokenizer.parseRefreshToken(refreshToken);

        Long userId = claims.get("userId", Long.class);
        if (userId == null) {
            throw new AuthenticationFailedException("refreshToken payload에 userId가 없습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유효하지 않은 refreshToken 입니다."));

        if (UserStatus.WITHDRAWN_BY_USER .equals(user.getStatus())) {
            throw new AuthenticationFailedException("탈퇴한 사용자입니다.");
        }
        else if (UserStatus.BANNED_BY_ADMIN  .equals(user.getStatus())){
            throw new AuthenticationFailedException("차단 당한 사용자입니다.");
        }

        RefreshToken saved = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유효하지 않은 refreshToken 입니다."));


        // 저장된 DB 토큰 값과 유저 토큰 일치 확인
        if (!saved.getToken().equals(refreshToken)) {
            throw new AuthenticationFailedException("유효하지 않은 refreshToken 입니다.");
        }

        //DB 만료 확인
        if (saved.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthenticationFailedException("만료된 refreshToken 입니다.");
        }

        //새 accessToken 발급
        String newAccessToken = jwtTokenizer.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );
        return new TokenResponse(newAccessToken);
    }
}
