package org.example.onebyte.dto.admin.category;

public record CategoryGroupResponse(
        Long id,
        String name,
        int sortOrder,
        boolean isActive
) {
}
