package org.example.onebyte.dto.category;

import lombok.Builder;
import lombok.Getter;
import org.example.onebyte.entity.Category;



@Getter
@Builder
public class CategoryResponse {
    private Long id;
    private String code;
    private String name;
    private boolean isActive;

    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .isActive(category.isActive())
                .build();
    }
}
