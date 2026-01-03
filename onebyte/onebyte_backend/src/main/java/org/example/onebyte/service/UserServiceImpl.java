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

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

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

    // 추후 변경 가능
    private final long refreshMaxAgeSeconds = 24 * 60 * 60L;

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

        // 상태 체크
        if (UserStatus.WITHDRAWN_BY_USER.equals(user.getStatus())) {
            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (UserStatus.BANNED_BY_ADMIN.equals(user.getStatus())) {
            throw new AuthenticationFailedException("관리자에 의해 차단당한 사용자 입니다.");
        }

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // accessToken 생성
        String accessToken = jwtTokenizer.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        // refreshToken 생성
        String refreshToken = jwtTokenizer.createRefreshToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        // 유저당 1개 정책: 기존꺼 삭제 후 저장
        refreshTokenRepository.deleteByUserId(user.getId());
        refreshTokenRepository.flush();

        RefreshToken rt = RefreshToken.create(
                user,
                refreshToken,
                LocalDateTime.now().plusSeconds(refreshMaxAgeSeconds)
        );

        refreshTokenRepository.save(rt);

        // refreshToken 쿠키 세팅
        cookieUtil.addRefreshTokenCookie(response, refreshToken, refreshMaxAgeSeconds);

        // 바디에는 accessToken만
        return new TokenResponse(accessToken);
    }

    // 로그아웃(DB refresh 삭제 + 쿠키 만료)
    @Override
    public ResponseEntity<MessageResponse> logout(String authorization, HttpServletResponse response) {

        Long userId = jwtTokenizer.getUserIdFromToken(authorization);

        refreshTokenRepository.deleteByUserId(userId);

        cookieUtil.expireRefreshTokenCookie(response);

        return ResponseEntity.ok(new MessageResponse("로그아웃이 되었습니다."));
    }

    // 토큰 재발급 (access + refresh 롤링 + 쿠키 갱신)
    @Override
    public TokenResponse reissue(String refreshToken, HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AuthenticationFailedException("refreshToken이 없습니다.");
        }

        // 1) refreshToken 검증/파싱 (만료/위조 예외 통일)
        final Claims claims;
        try {
            claims = jwtTokenizer.parseRefreshToken(refreshToken);
        } catch (ExpiredJwtException e) {
            throw new AuthenticationFailedException("만료된 refreshToken 입니다.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new AuthenticationFailedException("유효하지 않은 refreshToken 입니다.");
        }

        Long userId = claims.get("userId", Long.class);
        if (userId == null) {
            throw new AuthenticationFailedException("refreshToken payload에 userId가 없습니다.");
        }

        // 2) 유저 상태 체크
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유효하지 않은 refreshToken 입니다."));

        if (UserStatus.WITHDRAWN_BY_USER.equals(user.getStatus())) {
            throw new AuthenticationFailedException("탈퇴한 사용자입니다.");
        } else if (UserStatus.BANNED_BY_ADMIN.equals(user.getStatus())) {
            throw new AuthenticationFailedException("차단 당한 사용자입니다.");
        }

        // 3) DB 저장된 refreshToken과 일치 확인
        RefreshToken saved = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new AuthenticationFailedException("유효하지 않은 refreshToken 입니다."));

        if (!saved.getToken().equals(refreshToken)) {
            throw new AuthenticationFailedException("유효하지 않은 refreshToken 입니다.");
        }

        if (saved.isExpired()) {
            throw new AuthenticationFailedException("만료된 refreshToken 입니다.");
        }

        // 4) 새 accessToken 발급
        String newAccessToken = jwtTokenizer.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        // 5) refreshToken 롤링 + DB 갱신
        String newRefreshToken = jwtTokenizer.createRefreshToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );

        saved.rotate(
                newRefreshToken,
                LocalDateTime.now().plusSeconds(refreshMaxAgeSeconds)
        );

        // 6) 쿠키 갱신
        cookieUtil.addRefreshTokenCookie(response, newRefreshToken, refreshMaxAgeSeconds);

        return new TokenResponse(newAccessToken);
    }
}
