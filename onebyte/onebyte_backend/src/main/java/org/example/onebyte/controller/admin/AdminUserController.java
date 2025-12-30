package org.example.onebyte.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.MessageResponse;
import org.example.onebyte.dto.admin.user.BanRequest;
import org.example.onebyte.service.admin.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @PatchMapping("/{id}/ban")
    public ResponseEntity<MessageResponse> banUser(
            @PathVariable Long id,
            @Valid @RequestBody BanRequest request
    ) {
        adminUserService.banUser(id, request.getReason());
        return ResponseEntity.ok(new MessageResponse("차단 완료했습니다."));
    }

    @PatchMapping("/{id}/unban")
    public ResponseEntity<MessageResponse> unbanUser(@PathVariable Long id) {
        adminUserService.unbanUser(id);
        return ResponseEntity.ok(new MessageResponse("차단 해제했습니다."));
    }
}

