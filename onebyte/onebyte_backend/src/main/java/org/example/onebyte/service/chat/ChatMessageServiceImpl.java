package org.example.onebyte.service.chat;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.chat.ChatMessageRequest;
import org.example.onebyte.dto.chat.ChatMessageResponse;
import org.example.onebyte.entity.User;
import org.example.onebyte.entity.chat.ChatMessage;
import org.example.onebyte.entity.chat.ChatRoom;
import org.example.onebyte.exception.AccessDeniedException;
import org.example.onebyte.repository.ChatMessageRepository;
import org.example.onebyte.repository.ChatRoomRepository;
import org.example.onebyte.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class ChatMessageServiceImpl implements ChatMessageService{

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatRoomService chatRoomService;  // 권한 검증 로직 추가를 위한 의존관계 주입

    // 실시간 메시지 전송을 위해서 템플릿 주입
    private final SimpMessagingTemplate messagingTemplate;


    // 메시지 저장 & 전송 권한 확인
    @Override
    @Transactional
    public ChatMessageResponse saveMessage(ChatMessageRequest request, Long currentUserId) {

        ChatRoom chatRoom = chatRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다."));

        // sendId 의 해당 채팅방에 참여할 권한이 있는지 확인
        chatRoomService.validateChatRoomAccess(chatRoom, currentUserId);

        // 상대방이 나간 상태라면 메시지를 다시 보내면 다시 해당 채팅방으로 입장
        chatRoom.resetLeftStatus();

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        ChatMessage chatMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(request.getContent())
                .build();

        // 영속성 컨텍스로 관리되기 때문에 sender 만 보내더라도 해당 sender 의 nickname 등이 다 같이 저장되고 ChatMessageResponse 에 담겨진다.
        chatMessageRepository.save(chatMessage);

        // 실시간 정렬을 위해서 시간을 갱신
        chatRoom.updateLastMessageTime();

        return ChatMessageResponse.fromEntity(chatMessage);
    }

    // 메시지 내역 조회
    // 조회 권한과 읽음 처리 부분
    @Transactional
    @Override
    public Slice<ChatMessageResponse> getChatMessages(Long roomId, Long currentUserId, Pageable pageable) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다."));

        // 채팅방에 들어올 권한이 있는지 확인
        // 권한이 있는 사람만 대화 내역을 조회할 수 있도록 설정
        chatRoomService.validateChatRoomAccess(chatRoom, currentUserId);

        // 읽음 처리 -> 내가 들어왔을 때 상대방이 보낸 안 읽음 메시지 전부 읽음으로 처리
        List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadMessages(roomId, currentUserId);
        unreadMessages.forEach(ChatMessage::markAsRead);

        // 변경 사항을 트랜잭션이 바로 DB 에 반영할 수 있도록 함
        chatMessageRepository.flush();

        // 메시지 페이징 조회 (최신 순으로)
        Slice<ChatMessage> messagesSlice = chatMessageRepository.findChatMessagesByChatRoomId(roomId, pageable);

        // 시간 순 정렬 과 isRead 필드가 포함된 DTO 를 반환
        List<ChatMessageResponse> responses = messagesSlice.getContent().stream()
                .map(message -> {
                    ChatMessageResponse response = ChatMessageResponse.fromEntity(message);

                    // 삭제된 메시지라면 내용을 바꿈
                    if (message.isDeleted()) {
                        return response.toDeletedMessage("삭제된 메시지입니다.");
                    }
                    return response;
                })
                .sorted(Comparator.comparing(ChatMessageResponse::getSendTime))
                .collect(Collectors.toList());

        return new SliceImpl<>(responses, pageable, messagesSlice.hasNext());
    }

    // 메시지 수정
    @Transactional
    @Override
    public ChatMessageResponse updateMessage(Long messageId, Long userId, String newContent) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("메시지를 찾을 수 없습니다."));

        if (!message.getSender().getId().equals(userId)) {
            throw new AccessDeniedException("메시지 수정 권한이 없습니다.");
        }

        message.updateContent(newContent);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);

        // 실시간으로 수정된 내용을 전파
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getChatRoom().getId(), response);

        return response;
    }


    // 메시지 삭제
    @Transactional
    @Override
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("메시지를 찾을 수 없습니다."));

        // 본인이 쓴 메시지인지 확인
        if (!message.getSender().getId().equals(userId)) {
            throw new AccessDeniedException("메시지 삭제 권한이 없습니다.");
        }

        message.deleteMessage();

        // 실시간으로 삭제된 알림 전파
        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);
        response.toDeletedMessage("삭제된 메시지입니다.");

        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getChatRoom().getId(), response);
    }
}
