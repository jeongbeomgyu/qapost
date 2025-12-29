package org.example.onebyte.config;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.security.CustomAuthenticationEntryPoint;
import org.example.onebyte.security.JwtAuthenticationFilter;
import org.example.onebyte.security.JwtTokenizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenizer jwtTokenizer;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ✅ CORS 설정 (프론트 주소에 맞춰야 함)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Vite 기본 포트: 5173 (너 프론트 주소가 다르면 여기 바꿔)
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        // Authorization 헤더 쓰면 보통 true가 편함(쿠키/세션 안 써도 상관 없음)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtTokenizer);

        http
                // Spring Security에서 CORS를 "실제로" 켬
                .cors(cors -> {})

                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint))

                .authorizeHttpRequests(auth -> auth
                        // CORS preflight (브라우저 OPTIONS) 무조건 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 인증 없이 접근 허용 (Auth)
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/users/register",
                                "/api/users/login"
                        ).permitAll()

                        // 카테고리 조회는 누구나
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()

                        // 게시글 조회는 누구나
                        .requestMatchers(HttpMethod.GET, "/api/boards/**").permitAll()

                        // 댓글 조회는 누구나
                        .requestMatchers(HttpMethod.GET, "/api/boards/*/comments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()

                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("ROLE_ADMIN")

                        // 나머지는 로그인 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터 등록
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
