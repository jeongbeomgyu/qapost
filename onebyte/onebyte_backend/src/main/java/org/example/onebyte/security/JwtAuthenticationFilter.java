package org.example.onebyte.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.onebyte.exception.JwtExceptionCode;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenizer jwtTokenizer;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // CORS preflight 무조건 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ permitAll인 애들은 토큰 검사 자체를 스킵해도 됨 (원하면 더 추가)
        // (카테고리/보드 GET은 굳이 토큰 파싱하다 터질 이유가 없음)
        if (path.equals("/api/users/login")
                || path.equals("/api/users/register")
                || path.equals("/error")) {
            filterChain.doFilter(request, response);
            return;
        }

        // request 에서 토큰 얻어오기
        String token = getToken(request);

        // 토큰 없으면 그냥 통과
        if (!StringUtils.hasText(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 토큰이 있으면: 유효할 때만 인증 세팅, 아니면 "통과"
        try {
            setAuthentication(token); // 이름 바꿔서 의도 명확하게
        } catch (ExpiredJwtException e) {
            // 만료 토큰이면 인증 세팅 안 하고 통과
            request.setAttribute("exception", JwtExceptionCode.EXPIRED_TOKEN.getCode());
            SecurityContextHolder.clearContext();
            log.warn("Expired Token (pass through): {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            request.setAttribute("exception", JwtExceptionCode.UNSUPPORTED_TOKEN.getCode());
            SecurityContextHolder.clearContext();
            log.warn("Unsupported Token (pass through): {}", e.getMessage());
        } catch (MalformedJwtException e) {
            request.setAttribute("exception", JwtExceptionCode.INVALID_TOKEN.getCode());
            SecurityContextHolder.clearContext();
            log.warn("Invalid Token (pass through): {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            request.setAttribute("exception", JwtExceptionCode.NOT_FOUND_TOKEN.getCode());
            SecurityContextHolder.clearContext();
            log.warn("Not Found Token (pass through): {}", e.getMessage());
        } catch (Exception e) {
            // 나머지도 인증 세팅 안 하고 통과
            SecurityContextHolder.clearContext();
            log.error("JWT Filter Internal Error (pass through): {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    // 토큰을 얻어오는 메소드
    private String getToken(HttpServletRequest request) {

        // 헤더에 access 토큰이 있을 경우
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }

        // 쿠키로 access 토큰이 들어왔을 때
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    // 토큰 파싱 & 인증객체 세팅
    private void setAuthentication(String token) {
        Claims claims = jwtTokenizer.parseAccessToken(token);

        String email = claims.getSubject();
        String name = claims.get("name", String.class);
        String nickname = claims.get("nickname", String.class);
        Long userId = claims.get("userId", Long.class);

        List<GrantedAuthority> authorities = getAuthorities(claims);

        CustomUserDetails customUserDetails = new CustomUserDetails(
                email, nickname, "", name, userId, authorities
        );

        Authentication authentication =
                new JwtAuthenticationToken(authorities, customUserDetails, null);

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    // 권한 정보를 List<String> 에서 List<GrantedAuthority> 로 바꾸는 메소드
    private List<GrantedAuthority> getAuthorities(Claims claims) {
        String rolesName = claims.get("roles", String.class);
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (rolesName != null) {
            authorities.add(new SimpleGrantedAuthority(rolesName));
        }

        return authorities;
    }
}
