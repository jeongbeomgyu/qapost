package org.example.onebyte.service.chat;

import org.example.onebyte.dto.chat.ChatRoomRequest;
import org.example.onebyte.dto.chat.ChatRoomResponse;
import org.example.onebyte.entity.chat.ChatRoom;

import java.util.List;

public interface ChatRoomService {

    // 생성된 모든 방 조회
    ChatRoom createOrGetChatRoom(ChatRoomRequest request, Long currentUserId);

    // 유저의 이름으로 조회
    List<ChatRoomResponse> findAllByUserId(Long userId, String keyword);

    // 채팅방 접근 권한 확인
    void validateChatRoomAccess(ChatRoom chatRoom, Long userId);

    // roomId 로 채팅방 접근 권한 확인
    void validateChatRoomAccess(Long roomId, Long userId);

    // 마지막 메시지 가져오기
    String getLatestContent(Long roomId);

    // 채팅방 나가기
    void leaveChatRoom(Long roomId, Long userId);
}
