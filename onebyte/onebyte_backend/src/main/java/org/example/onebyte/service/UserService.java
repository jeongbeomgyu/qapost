package org.example.onebyte.service;

import jakarta.servlet.http.HttpServletResponse;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.user.*;
import org.springframework.http.ResponseEntity;

public interface UserService {

    // 회원가입
    MessageResponse register(RegisterRequest request);

    // 로그인 (accessToken 바디 + refreshToken 쿠키 세팅 + refreshToken DB 저장)
    TokenResponse login(LoginRequest request, HttpServletResponse response);

    // 토큰 재발급 (accessToken 재발급 + refreshToken 롤링 + 쿠키 갱신)
    TokenResponse reissue(String refreshToken, HttpServletResponse response);

    // 로그아웃 (Authorization 헤더의 accessToken으로 userId 추출 -> DB refresh 삭제 + 쿠키 만료)
    ResponseEntity<MessageResponse> logout(String authorization, HttpServletResponse response);
}
