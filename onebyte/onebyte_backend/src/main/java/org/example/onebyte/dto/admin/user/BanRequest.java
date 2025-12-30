package org.example.onebyte.dto.admin.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BanRequest {

    @NotBlank
    @Size(max = 255)
    private String reason;
}
