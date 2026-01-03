package org.example.onebyte.dto.chat;

import lombok.Builder;
import lombok.Getter;
import org.example.onebyte.entity.chat.ChatRoom;

@Builder
@Getter
public class ChatRoomResponse {

    private Long roomId;
    private Long boardId;
    private String boardTitle;

    // 발신자 정보 -> 채팅방을 만드는 사람의 정보
    private Long senderId;
    private String senderNickname;

    // 수신자 정보 -> 채팅방에 초대된 사람의 정보
    private Long receiverId;
    private String receiverNickname;

    // 마지막 메시지 필드
    private String lastMessage;

    // 안 읽은 메시지 개수
    private Long unreadCount;

    public static ChatRoomResponse fromEntity(ChatRoom entity, String lastMessage, Long unreadCount) {

        return ChatRoomResponse.builder()
                .roomId(entity.getId())
                .boardId(entity.getBoard().getId())
                .boardTitle(entity.getBoard().getTitle())
                .senderId(entity.getSender().getId())
                .senderNickname(entity.getSender().getNickname())
                .receiverId(entity.getReceiver().getId())
                .receiverNickname(entity.getReceiver().getNickname())
                .lastMessage(lastMessage != null ? lastMessage : "대화 내용이 없습니다.")
                .unreadCount(unreadCount)
                .build();
    }

}
