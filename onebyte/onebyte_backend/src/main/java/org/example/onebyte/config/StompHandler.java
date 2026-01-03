package org.example.onebyte.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.onebyte.exception.AccessDeniedException;
import org.example.onebyte.security.JwtTokenizer;
import org.example.onebyte.service.chat.ChatRoomService;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenizer jwtTokenizer;
    private final ChatRoomService chatRoomService;

    @Override
    public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            // Authorization 헤더에서 accessToken 추출 -> NativeHeader 에서 가져와야한다.
            String accessToken = accessor.getFirstNativeHeader("Authorization");
            log.info("STOMP CONNECT: {}", accessToken);

            // 토큰이 없는 경우 예외 처리
            if (accessToken == null || accessToken.isBlank()) {
                throw new IllegalArgumentException("메시지를 전송할 권한이 없습니다.");
            }

            try {
                // 토큰에서 userId 추출
                Long userId = jwtTokenizer.getUserIdFromToken(accessToken);

                // Principal 객체를 생성 후 accessor 에 담아줌
                accessor.setUser(new StompPrincipal(userId));

            } catch (Exception e) {
                log.error("STOMP 토큰 검증 실패 : {}", e.getMessage());
                throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
            }

        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/sub/chat/room")) {
                Long roomId = extractRoomId(destination);
                StompPrincipal principal = (StompPrincipal) accessor.getUser();

                if (principal == null) throw new AccessDeniedException("인증 정보가 없습니다.");

                chatRoomService.validateChatRoomAccess(roomId, principal.getUserId());
                log.info("구독 승인: 유저 {} -> 방 {}", principal.getUserId(), roomId);
            }
        }

        return message;
    }

    private Long extractRoomId(String destination) {
        try {
            return Long.parseLong(destination.split("/room/")[1]);
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 구독 경로입니다.");
        }
    }
}
