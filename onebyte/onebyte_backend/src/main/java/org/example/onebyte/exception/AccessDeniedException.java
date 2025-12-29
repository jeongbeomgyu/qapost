package org.example.onebyte.exception;

import lombok.Getter;

@Getter
public class AccessDeniedException extends RuntimeException{

    private final String resource;
    private final Long resourceId;
    private final String action;

    public AccessDeniedException(String message) {
        super(message);
        this.resource = null;
        this.resourceId = null;
        this.action = null;
    }

    public AccessDeniedException(String resource, Long resourceId, String action) {
        super(String.format("%s(ID: %d)에 대한 %s 권한이 없습니다.", resource, resourceId, action));
        this.resource = resource;
        this.resourceId = resourceId;
        this.action = action;
    }

    // 게시글 수정 권한이 없을 경우
    public static AccessDeniedException boardUpdate(Long id) {
        return new AccessDeniedException("Board", id, "UPDATE");
    }

    // 댓글 삭제 권한이 없을 경우
    public static AccessDeniedException commentDelete(Long id) {
        return new AccessDeniedException("Comment", id, "DELETE");
    }
}
