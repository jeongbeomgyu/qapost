package org.example.onebyte.dto.category;

public record CategoryRequest(
        Long groupId // null이면 전체 트리 조회, 값 있으면 특정 group만
) {
}
