package org.example.onebyte.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequestDto {

    @NotBlank(message = "카테고리의 코드를 입력해주세요")
    private String code;

    @NotBlank(message = "카테고리의 이름을 입력해주세요")
    private String name;

    private Boolean isActive;
}
