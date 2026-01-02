package org.example.onebyte.dto.chat;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoomRequest {

    private Long boardId;   // 어느 게시글의 채팅방인지
    private Long senderId; // 채팅을 거는 사람
    private Long receiverId; // 채팅을 받을 사람
}
