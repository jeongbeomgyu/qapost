package org.example.onebyte.service;

import jakarta.servlet.http.HttpServletResponse;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.user.*;
import org.springframework.http.ResponseEntity;

public interface UserService {
    // 회원가입(+자동로그인 정책이면 토큰까지 발급)
    MessageResponse register(RegisterRequest request);

    // 로그인(토큰 발급 + refresh 쿠키 세팅)
    TokenResponse login(LoginRequest request, HttpServletResponse response);

    // 토큰 재발급(accessToken만 새로 발급)
    TokenResponse reissue(String refreshToken);

    // 로그아웃(DB refresh 삭제 + 쿠키 만료)
    ResponseEntity<MessageResponse> logout(String refreshToken, HttpServletResponse response);

}
