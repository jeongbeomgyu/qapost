package org.example.onebyte.exception;

public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(Long id) {
        super("게시글이 존재하지 않습니다. id=" + id);
    }
}
