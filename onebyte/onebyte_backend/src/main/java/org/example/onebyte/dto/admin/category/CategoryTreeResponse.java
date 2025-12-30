package org.example.onebyte.dto.admin.category;

import java.util.List;

public record CategoryTreeResponse(
        Long groupId,
        String groupName,
        int groupSortOrder,
        boolean groupIsActive,
        List<CategoryResponse> categories
) {
}
