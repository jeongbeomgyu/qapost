package org.example.onebyte.dto.admin.category;

public record CategoryResponse(
        Long id,
        String name,
        int sortOrder,
        boolean isActive
) {
}
