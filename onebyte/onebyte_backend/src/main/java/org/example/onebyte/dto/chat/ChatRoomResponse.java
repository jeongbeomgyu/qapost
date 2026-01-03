package org.example.onebyte.dto.chat;

import lombok.Builder;
import lombok.Getter;
import org.example.onebyte.entity.chat.ChatRoom;

import java.time.LocalDateTime;

@Builder
@Getter
public class ChatRoomResponse {

    // 프론트에서 표준으로 쓰는 키
    private Long id;

    private Long boardId;
    private String boardTitle;

    private Long senderId;
    private String senderNickname;

    private Long receiverId;
    private String receiverNickname;

    private String lastMessage;
    private Long unreadCount;

    // 채팅방 정렬/미리보기에서 유용
    private LocalDateTime lastMessageTime;

    public static ChatRoomResponse fromEntity(ChatRoom entity, String lastMessage, Long unreadCount) {
        return ChatRoomResponse.builder()
                .id(entity.getId()) // roomId -> id
                .boardId(entity.getBoard().getId())
                .boardTitle(entity.getBoard().getTitle())
                .senderId(entity.getSender().getId())
                .senderNickname(entity.getSender().getNickname())
                .receiverId(entity.getReceiver().getId())
                .receiverNickname(entity.getReceiver().getNickname())
                .lastMessage(lastMessage != null ? lastMessage : "대화 내용이 없습니다.")
                .unreadCount(unreadCount)
                .lastMessageTime(entity.getLastMessageTime())
                .build();
    }
}
