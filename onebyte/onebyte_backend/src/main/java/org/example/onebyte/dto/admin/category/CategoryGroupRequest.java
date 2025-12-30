package org.example.onebyte.dto.admin.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CategoryGroupRequest(
        @NotBlank String name,
        @NotNull Integer sortOrder,
        @NotNull Boolean isActive
) {
}
