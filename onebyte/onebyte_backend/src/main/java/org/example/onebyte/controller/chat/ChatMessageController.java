package org.example.onebyte.controller.chat;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.chat.ChatMessageRequest;
import org.example.onebyte.dto.chat.ChatMessageResponse;
import org.example.onebyte.security.CustomUserDetails;
import org.example.onebyte.service.chat.ChatMessageService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    // 메시지 전체 가져오기
    @GetMapping("/room/{roomId}/messages")
    public ResponseEntity<Slice<ChatMessageResponse>> getMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 30) Pageable pageable) {

        Slice<ChatMessageResponse> chatMessages = chatMessageService.getChatMessages(roomId, userDetails.getUserId(), pageable);

        return ResponseEntity.ok(chatMessages);
    }

    // 메시지 수정
    @PatchMapping("/message/{messageId}")
    public ResponseEntity<ChatMessageResponse> updateMessage(
            @PathVariable Long messageId,
            @RequestBody ChatMessageRequest updateRequest,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ChatMessageResponse chatMessageResponse = chatMessageService.updateMessage(messageId, userDetails.getUserId(), updateRequest.getContent());
        return ResponseEntity.ok(chatMessageResponse);
    }

    // 메시지 삭제
    @DeleteMapping("/message/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        chatMessageService.deleteMessage(messageId, userDetails.getUserId());
        return ResponseEntity.noContent().build();
    }
}
