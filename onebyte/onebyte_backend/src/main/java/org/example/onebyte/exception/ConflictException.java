package org.example.onebyte.exception;

import org.springframework.http.HttpStatus;

// 카테고리 충돌 예외처리
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }

    public HttpStatus status() {
        return HttpStatus.CONFLICT;
    }
}
