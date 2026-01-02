package org.example.onebyte.dto.category;

import java.util.List;

public record PublicCategoryTreeResponse(
        Long groupId,
        String groupName,
        int groupSortOrder,
        List<SubCategoryResponse> categories
) {
    public record SubCategoryResponse(
            Long id,
            String name,
            int sortOrder
    ) {}
}
