package org.example.onebyte.security;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.example.onebyte.exception.JwtExceptionCode;
import org.example.onebyte.type.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenizer {

    private final byte[] accessSecret;
    private final byte[] refreshSecret;

    public final Long accessTokenExpireCount;
    public final  Long refreshTokenExpireCount;

    public JwtTokenizer(@Value("${jwt.secretKey}") String accessSecret,
                        @Value("${jwt.refreshKey}") String refreshSecret,
                        @Value("${jwt.access-expiration-time}") String accessTokenExpireCount,
                        @Value("${jwt.fresh-expiration-time}") String refreshTokenExpireCount) {
        this.accessSecret = accessSecret.getBytes(StandardCharsets.UTF_8);
        this.refreshSecret = refreshSecret.getBytes(StandardCharsets.UTF_8);
        this.accessTokenExpireCount = Long.parseLong(accessTokenExpireCount);
        this.refreshTokenExpireCount = Long.parseLong(refreshTokenExpireCount);
    }

    // JWT 토큰 생성 메소드
    private String createToken(Long id,
                               String email,
                               String name,
                               String nickname,
                               Role role,
                               Long expire,
                               byte[] secretKey) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expire);
        return Jwts.builder()
                .subject(email)
                .claim("name", name)
                .claim("nickname", nickname)
                .claim("userId", id)
                .claim("roles", role.name())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey(secretKey))
                .compact();
    }

    // 토큰에 추가할 성명 가져오는 메소드
    private SecretKey getSigningKey(byte[] secretKey) {
        return Keys.hmacShaKeyFor(secretKey);
    }

    // Access 토큰 생성
    public String createAccessToken (Long id, String email, String name, String nickname, Role role) {
        return createToken(id, email, name, nickname, role, accessTokenExpireCount, accessSecret);
    }

    // Refresh 토큰 생성
    public String createRefreshToken(Long id, String email, String name, String nickname, Role role) {
        return createToken(id, email, name, nickname, role, refreshTokenExpireCount, refreshSecret);
    }

    // 토큰을 파싱하는 메소드
    private Claims parseToken(String token, byte[] secret) {
        return Jwts.parser()
                .verifyWith(getSigningKey(secret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Access Token 파싱
    public Claims parseAccessToken(String accessToken) {
        return parseToken(accessToken, accessSecret);
    }

    // Refresh Token 파싱
    public Claims parseRefreshToken(String refreshToken) {
        return parseToken(refreshToken, refreshSecret);
    }

    // 토큰에서 id 값만 꺼내는 메소드
    public Long getUserIdFromToken(String token) {
        if (token == null || !token.startsWith("Bearer")) {
            throw new IllegalArgumentException("잘못된 Token 입니다.");
        }

        try {
            String jwt = token.substring(7);
            Claims claims = parseToken(jwt, accessSecret);
            return claims.get("userId", Long.class);
        } catch (ExpiredJwtException e) {
            log.warn("만료된 Access 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.EXPIRED_TOKEN.getMessage());
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("유효하지 않은 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.INVALID_TOKEN.getMessage());
        } catch (Exception e) {
            log.warn("JWT 파싱 중 발생항 알 수 없는 오류 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.UNKNOWN_ERROR.getMessage());
        }
    }
}
