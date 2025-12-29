package org.example.onebyte.dto.mypage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

//아마 추후에 프론트와 합치면서
//제약조건을 넣어야될 것으로 추정
@Getter
public class UpdateInfoRequest {
    private String name;
    private String nickname;
}
