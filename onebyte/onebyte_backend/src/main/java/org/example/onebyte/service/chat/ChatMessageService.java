package org.example.onebyte.service.chat;

import org.example.onebyte.dto.chat.ChatMessageRequest;
import org.example.onebyte.dto.chat.ChatMessageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ChatMessageService {

    // 메시지 저장
    ChatMessageResponse saveMessage(ChatMessageRequest request, Long currentUserId);

    // 메시지 내역 조회
    Slice<ChatMessageResponse> getChatMessages(Long roomId, Long currentUserId, Pageable pageable);

    // 메시지 수정
    ChatMessageResponse updateMessage(Long messageId, Long userId, String newContent);

    // 메시지 삭제
    void deleteMessage(Long messageId, Long userId);


}
