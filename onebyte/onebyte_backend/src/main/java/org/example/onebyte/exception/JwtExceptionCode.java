package org.example.onebyte.exception;

import lombok.Getter;

import java.util.Arrays;

public enum JwtExceptionCode {
    UNKNOWN_ERROR("UNKNOWN_ERROR", "알 수 없는 오류입니다."),
    NOT_FOUND_TOKEN("NOT_FOUND_TOKEN", "Header 에서 유효한 토큰의 형식을 찾지 못했습니다."),
    INVALID_TOKEN("INVALID_TOKEN", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN("EXPIRED_TOKEN", "기간이 만료된 토큰입니다."),
    UNSUPPORTED_TOKEN("UNSUPPORTED_TOKEN", "해당 서버에서 지원하지 않는 토큰입니다.");


    JwtExceptionCode(String code, String message) {
        this.code = code;
        this.message = message;
    }


    @Getter
    private String code;

    @Getter
    private String message;


    public static JwtExceptionCode findByCode(String code) {
        return Arrays.stream(JwtExceptionCode.values())
                .filter(c -> c.getCode().equals(code))
                .findFirst()
                .orElse(UNKNOWN_ERROR);
    }

}
