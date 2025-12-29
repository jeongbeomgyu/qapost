package org.example.onebyte.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//회원가입
@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "이름을 입력해주세요.")
    @Size(min = 2, max = 30, message = "이름은 2~30자여야 합니다.")
    private String name;

    @NotBlank(message = "닉네임을 입력해주세요.")
    @Size(min = 2, max = 30, message = "닉네임은 2~30자여야 합니다.")
    private String nickname;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다.")
    private String email;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Size(min = 8, max = 50, message = "비밀번호는 8~50자여야 합니다.")
    // 최소 규칙(너무 빡세게 안 걸고 싶으면 이 @Pattern은 지워도 됨)
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "비밀번호는 영문과 숫자를 최소 1개씩 포함해야 합니다."
    )
    private String password;
}