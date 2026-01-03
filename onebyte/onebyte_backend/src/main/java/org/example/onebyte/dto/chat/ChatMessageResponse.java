package org.example.onebyte.dto.chat;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.onebyte.entity.chat.ChatMessage;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long roomId;
    private String senderNickname;
    private Long senderId;
    @Setter
    private String content;
    private LocalDateTime sendTime;
    private boolean isRead;

    public static ChatMessageResponse fromEntity(ChatMessage entity) {
        return ChatMessageResponse.builder()
                .roomId(entity.getChatRoom().getId())
                .senderId(entity.getSender().getId())
                .senderNickname(entity.getSender().getNickname())
                .content(entity.getContent())
                .sendTime(entity.getSendTime())
                .isRead(entity.isRead())
                .build();
    }

    // 메시지가 삭제되었을 때 나오는 메시지에 대한 설정
    public ChatMessageResponse toDeletedMessage(String message) {
        this.content = message;
        return this;
    }

}
