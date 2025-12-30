package org.example.onebyte.dto.admin.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CategoryRequest(
        @NotNull Long groupId,
        @NotBlank String name,
        @NotNull Integer sortOrder,
        @NotNull Boolean isActive
) {
}
