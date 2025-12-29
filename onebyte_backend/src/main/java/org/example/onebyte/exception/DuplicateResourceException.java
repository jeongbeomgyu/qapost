package org.example.onebyte.exception;

import lombok.Getter;

@Getter
public class DuplicateResourceException extends RuntimeException {

    private final String resource; // 예: "User"
    private final String field;    // 예: "email", "nickname"
    private final String value;    // 예: "user1@test.com" (선택)

    public DuplicateResourceException(String resource, String field, String value) {
        super(String.format("%s already exists: %s=%s", resource, field, value));
        this.resource = resource;
        this.field = field;
        this.value = value;
    }

    public DuplicateResourceException(String resource, String field) {
        super(String.format("%s already exists: %s", resource, field));
        this.resource = resource;
        this.field = field;
        this.value = null;
    }


    public static DuplicateResourceException userEmail(String email) {
        return new DuplicateResourceException("User", "email", email);
    }

    public static DuplicateResourceException userNickname(String nickname) {
        return new DuplicateResourceException("User", "nickname", nickname);
    }
}
