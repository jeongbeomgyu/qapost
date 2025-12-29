package org.example.onebyte.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BoardRequest(

        @NotNull(message = "categoryId는 필수입니다.")
        Long categoryId,

        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        @Size(max = 10000, message = "내용은 10000자 이하여야 합니다.") // 너희 기준으로 조절
        String content
) {}

