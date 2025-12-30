package org.example.onebyte.dto.admin.category;

import jakarta.validation.constraints.NotNull;

import java.util.List;

// 대분류 재정렬
public record CategoryGroupReorderRequest(
        @NotNull List<Long> orderedGroupIds
) {
}
