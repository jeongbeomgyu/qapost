package org.example.onebyte.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketBrokerConfig implements WebSocketMessageBrokerConfigurer {

    private final StompHandler stompHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Stomp 연결 엔드 포인트
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns(
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "http://44.220.167.111:3000",
                        "http://44.220.167.111")
                .addInterceptors(new HttpSessionHandshakeInterceptor()) // 쿠키/세션 정보 활용 가능하게 함
                 .withSockJS();  // SockJS 지원 설정

    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        // 메시지를 받을 때 -> /sub/chat/room/{roomId} (해당 ChatRoom 의 ID 를 가지고 해당 채팅방의 메시지가 오기를 대기 하는 상태)
        registry.enableSimpleBroker("/sub");

        // 메시지를 보낼 때 -> /pub/chat/message (메시지를 보낼 대 사용하는 경로 -> 메시지가 바로 사용자에게 가지 않고 컨트롤러로 감 -> 컨트롤러에서 로직을 처리한 후 /sub 으로 지정한 ChatRoom 의 경로로 메시지를 보내준다.)
        registry.setApplicationDestinationPrefixes("/pub");
    }

    // 인터셉터 등록 (JwtAuthenticationFilter 의 경우 한 번만 실행되기 때문에 메시지가 올 때마다 확인 불가)
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompHandler);
    }


}
