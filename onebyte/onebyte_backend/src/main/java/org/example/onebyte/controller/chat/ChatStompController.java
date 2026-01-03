package org.example.onebyte.controller.chat;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.config.StompPrincipal;
import org.example.onebyte.dto.chat.ChatMessageRequest;
import org.example.onebyte.dto.chat.ChatMessageResponse;
import org.example.onebyte.service.chat.ChatMessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    // 새로운 메시지를 주고 받는 통로 역할만 한다.
    // 수정 삭제는 ChatMessageController 에서 담당

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;

    // 메시지 전송 밑 저장
    // 사용자가 /pub/chat/message 로 메시지를 보낼 시 호출
    @MessageMapping("/chat/message")
    public void sendMessage(ChatMessageRequest request, Principal principal) {

        // principal 에서 userId 추출
        StompPrincipal stompPrincipal = (StompPrincipal) principal;
        Long userId = stompPrincipal.getUserId();

        // 해당 컨트롤러에서 메시지를 저장 후
        ChatMessageResponse response = chatMessageService.saveMessage(request, userId);

        // 저장된 메시지를 해당 채팅방을 구독중인 사용자들에게 전송 (나도 내가 전송한 메시지를 봐야하기 때문이다.)
        // "/sub/chat/room/{roomId}" 형식으로
        messagingTemplate.convertAndSend("/sub/chat/room/" + response.getRoomId(), response);

    }
}
