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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenizer {

    private final byte[] accessSecret;
    private final byte[] refreshSecret;

    // ms 단위로 들어오는 값이라고 가정 (기존 코드 유지)
    public final Long accessTokenExpireCount;
    public final Long refreshTokenExpireCount;

    public JwtTokenizer(@Value("${jwt.secretKey}") String accessSecret,
                        @Value("${jwt.refreshKey}") String refreshSecret,
                        @Value("${jwt.access-expiration-time}") String accessTokenExpireCount,
                        @Value("${jwt.fresh-expiration-time}") String refreshTokenExpireCount) {
        this.accessSecret = accessSecret.getBytes(StandardCharsets.UTF_8);
        this.refreshSecret = refreshSecret.getBytes(StandardCharsets.UTF_8);
        this.accessTokenExpireCount = Long.parseLong(accessTokenExpireCount);
        this.refreshTokenExpireCount = Long.parseLong(refreshTokenExpireCount);
    }

    // =========================
    // Token Create
    // =========================

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

    private SecretKey getSigningKey(byte[] secretKey) {
        return Keys.hmacShaKeyFor(secretKey);
    }

    public String createAccessToken(Long id, String email, String name, String nickname, Role role) {
        return createToken(id, email, name, nickname, role, accessTokenExpireCount, accessSecret);
    }

    public String createRefreshToken(Long id, String email, String name, String nickname, Role role) {
        return createToken(id, email, name, nickname, role, refreshTokenExpireCount, refreshSecret);
    }

    // =========================
    // Token Parse
    // =========================

    private Claims parseToken(String token, byte[] secret) {
        return Jwts.parser()
                .verifyWith(getSigningKey(secret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseAccessToken(String accessToken) {
        return parseToken(accessToken, accessSecret);
    }

    public Claims parseRefreshToken(String refreshToken) {
        return parseToken(refreshToken, refreshSecret);
    }

    // =========================
    // Helpers
    // =========================

    /**
     * Authorization 헤더처럼 "Bearer xxx"로 오면 xxx만 잘라내고,
     * 그냥 토큰만 오면 그대로 리턴
     */
    public String extractToken(String tokenOrBearer) {
        if (tokenOrBearer == null) return null;
        if (tokenOrBearer.startsWith("Bearer ")) return tokenOrBearer.substring(7);
        return tokenOrBearer;
    }

    /**
     * ✅ 기존 코드 호환용: access 토큰에서 userId 뽑기
     * - "Bearer xxx" 또는 "xxx" 둘 다 허용
     * - accessSecret으로 파싱
     */
    public Long getUserIdFromToken(String tokenOrBearer) {
        String jwt = extractToken(tokenOrBearer);
        if (jwt == null || jwt.isBlank()) throw new IllegalArgumentException("잘못된 Token 입니다.");

        try {
            Claims claims = parseToken(jwt, accessSecret);
            return claims.get("userId", Long.class);
        } catch (ExpiredJwtException e) {
            log.warn("만료된 Access 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.EXPIRED_TOKEN.getMessage());
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("유효하지 않은 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.INVALID_TOKEN.getMessage());
        } catch (Exception e) {
            log.warn("JWT 파싱 중 알 수 없는 오류 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.UNKNOWN_ERROR.getMessage());
        }
    }

    /**
     * ✅ reissue용: refresh 토큰에서 userId 뽑기
     * - 쿠키에서 오는 refreshToken은 보통 "Bearer " 없음 → 그냥 토큰 그대로 들어옴
     */
    public Long getUserIdFromRefreshToken(String refreshTokenOrBearer) {
        String jwt = extractToken(refreshTokenOrBearer);
        if (jwt == null || jwt.isBlank()) throw new IllegalArgumentException("잘못된 Refresh Token 입니다.");

        try {
            Claims claims = parseToken(jwt, refreshSecret);
            return claims.get("userId", Long.class);
        } catch (ExpiredJwtException e) {
            log.warn("만료된 Refresh 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.EXPIRED_TOKEN.getMessage());
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("유효하지 않은 refresh 토큰 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.INVALID_TOKEN.getMessage());
        } catch (Exception e) {
            log.warn("Refresh JWT 파싱 중 알 수 없는 오류 : {}", e.getMessage());
            throw new RuntimeException(JwtExceptionCode.UNKNOWN_ERROR.getMessage());
        }
    }

    /**
     * ✅ reissue용: refresh 토큰 유효성만 체크 (true/false)
     */
    public boolean validateRefreshToken(String refreshTokenOrBearer) {
        String jwt = extractToken(refreshTokenOrBearer);
        if (jwt == null || jwt.isBlank()) return false;

        try {
            parseToken(jwt, refreshSecret);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * reissue용: refresh 토큰 만료시간(LocalDateTime) 꺼내기
     */
    public LocalDateTime getRefreshTokenExpiresAt(String refreshTokenOrBearer) {
        String jwt = extractToken(refreshTokenOrBearer);
        if (jwt == null || jwt.isBlank()) throw new IllegalArgumentException("잘못된 Refresh Token 입니다.");

        Claims claims = parseToken(jwt, refreshSecret);
        Date exp = claims.getExpiration();
        return LocalDateTime.ofInstant(exp.toInstant(), ZoneId.systemDefault());
    }
}
