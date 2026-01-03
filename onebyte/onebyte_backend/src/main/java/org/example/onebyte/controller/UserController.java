package org.example.onebyte.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.user.*;
import org.example.onebyte.service.UserService;
import org.example.onebyte.service.UserServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// 테스트
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> createUser(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("회원가입을 완료합니다."));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> loginUser(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        TokenResponse tokenResponse = userService.login(request, response);
        return ResponseEntity.ok(tokenResponse);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logoutUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            HttpServletResponse response
    ) {
        return userService.logout(authorization, response);
    }

    @PostMapping("/reissue")
    public ResponseEntity<TokenResponse> reissue(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(userService.reissue(refreshToken, response));
    }

}
