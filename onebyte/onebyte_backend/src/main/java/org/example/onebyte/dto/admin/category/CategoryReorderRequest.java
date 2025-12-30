package org.example.onebyte.dto.admin.category;

import jakarta.validation.constraints.NotNull;

import java.util.List;


// 소분류 재정렬
public record CategoryReorderRequest(
        @NotNull Long groupId,
        @NotNull List<Long> orderedCategoryIds
) {
}
