package org.example.onebyte.dto.chat;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.onebyte.entity.chat.ChatMessage;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {

    // ✅ 메시지 PK (프론트 key / 수정 / 삭제에 필수)
    private Long id;

    private Long roomId;
    private String senderNickname;
    private Long senderId;

    @Setter
    private String content;

    private LocalDateTime sendTime;
    private boolean isRead;

    // 삭제 여부 (프론트에서 삭제 UI 처리에 필수)
    private boolean isDeleted;

    public static ChatMessageResponse fromEntity(ChatMessage entity) {
        return ChatMessageResponse.builder()
                .id(entity.getId()) // 추가
                .roomId(entity.getChatRoom().getId())
                .senderId(entity.getSender().getId())
                .senderNickname(entity.getSender().getNickname())
                .content(entity.getContent())
                .sendTime(entity.getSendTime())
                .isRead(entity.isRead())
                .isDeleted(entity.isDeleted()) // 추가
                .build();
    }

    // 메시지가 삭제되었을 때 나오는 메시지에 대한 설정
    public ChatMessageResponse toDeletedMessage(String message) {
        this.content = message;
        this.isDeleted = true;
        return this;
    }
}
