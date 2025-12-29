package org.example.onebyte.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 회원가입/로그인/재발급API의 응답 포맷

@Getter
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
}