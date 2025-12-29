package org.example.onebyte.util;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    // 브라우저에 refreshToken 쿠키 심기
    public void addRefreshTokenCookie(HttpServletResponse response, String refreshToken, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)          // JS로 못 읽게(보안)
                .path("/")               // 전체 경로에서 쿠키 전송
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .sameSite("Lax")         // 로컬 개발에서 무난
                // .secure(true)         // HTTPS 환경에서만 켜기
                .build();
        
        // 헤드에 set-cookie 추가
        response.addHeader("Set-Cookie", cookie.toString());
    }

    // refreshToken 쿠키 삭제(만료)
    public void expireRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                //쿠키 삭제
                .maxAge(0)
                .sameSite("Lax")
                // 이건 테스트에선 x, HTTPS 배경환경에서 켜기
                // .secure(true)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}
