package org.example.onebyte.service.chat;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.onebyte.dto.chat.ChatRoomRequest;
import org.example.onebyte.dto.chat.ChatRoomResponse;
import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.User;
import org.example.onebyte.entity.chat.ChatMessage;
import org.example.onebyte.entity.chat.ChatRoom;
import org.example.onebyte.exception.AccessDeniedException;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.ChatMessageRepository;
import org.example.onebyte.repository.ChatRoomRepository;
import org.example.onebyte.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ChatRoomServiceImpl implements ChatRoomService{

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;


    @Transactional
    @Override
    public ChatRoom createOrGetChatRoom(ChatRoomRequest request, Long currentUserId) {

        // 채팅방에 연관된 게시글 존재 확인
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));


        // 발신자와 수신자 정보 조회 (currentUserId 는 발신자 -> 채팅방 생성을 요청한 사람)
        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 발신자입니다.."));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 수신자입니다."));

        // 본인에게 채팅을 거는 것을 막는 로직
        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalStateException("본인과는 채팅할 수 없습니다.");
        }

        // 채팅방 생성하기 전에 중복 확인 A -> B
        Optional<ChatRoom> existingRoom = chatRoomRepository.findByBoardAndSenderAndReceiver(board, sender, receiver);

        // 상대방이 나와 같은 채팅방이 있는지 확인 B -> A
        if (existingRoom.isEmpty()) {
            existingRoom = chatRoomRepository.findByBoardAndSenderAndReceiver(board, receiver, sender);
        }


        if (existingRoom.isPresent()) {
            ChatRoom room = existingRoom.get();
            room.resetLeftStatus(); // 대화 시작 시 채팅방이 양쪽 모두에게 보일 수 있도록 하는 설정 추가
            return room;
        } else {
            // 중복 확인 후 없을 경우 새로운 채팅방 생성
            ChatRoom chatRoom = ChatRoom.builder()
                    .board(board)
                    .sender(sender)
                    .receiver(receiver)
                    .build();

            return chatRoomRepository.save(chatRoom);
        }
    }

    // 채팅방 목록 조회
    @Override
    public List<ChatRoomResponse> findAllByUserId(Long userId, String keyword) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 1. 키워드 유무에 따라서 검색 또는 전체 조회
        List<ChatRoom> rooms;
        if (keyword != null && !keyword.isEmpty()) {
            rooms = chatRoomRepository.findAllByUserAndNickname(user, keyword);
        } else {
            rooms = chatRoomRepository.findAllByUser(user);
        }

        return rooms.stream().map(room -> {
            // 각 방의 마지막 메시지 한 줄 조회 (엔티티로)
            Slice<ChatMessage> lastMessageSlice = chatMessageRepository.findLatestMessage(room.getId(), PageRequest.of(0, 1));

            String lastMessage;

            if (lastMessageSlice.hasContent()) {
                ChatMessage message = lastMessageSlice.getContent().get(0);

                lastMessage = message.isDeleted() ? "삭제된 메시지입니다." : message.getContent();
            } else {
                lastMessage = "대화 내용이 없습니다.";
            }
            // 안 읽은 메시지 개수 조회
            Long unreadCount = chatMessageRepository.countUnreadMessages(room.getId(), userId);

            return ChatRoomResponse.fromEntity(room, lastMessage, unreadCount);
        }).collect(Collectors.toList());
    }

    // 현재 유저가 해당 방의 구성원인지 검증
    @Override
    public void validateChatRoomAccess(ChatRoom chatRoom, Long userId) {

        log.info("ChatRoom senderId = {}", chatRoom.getSender().getId());
        log.info("ChatRoom receiverId = {}", chatRoom.getReceiver().getId());
        log.info("JWT userId = {}", userId);
        if (!chatRoom.getSender().getId().equals(userId) &&
                !chatRoom.getReceiver().getId().equals(userId)) {
            throw new AccessDeniedException("해당 채팅방에 접근 권한이 없습니다.");
        }
    }

    @Override
    public void validateChatRoomAccess(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다."));
        validateChatRoomAccess(chatRoom, userId);
    }

    // 마지막 메시지 가져오기
    @Override
    public String getLatestContent(Long roomId) {
        Slice<ChatMessage> lastMessageSlice = chatMessageRepository.findLatestMessage(roomId, PageRequest.of(0, 1));

        if (lastMessageSlice.hasContent()) {
            ChatMessage message = lastMessageSlice.getContent().get(0);
            return message.isDeleted() ? "삭제된 메시지입니다." : message.getContent();
        }
        return null;
    }

    // 채팅방 나가기
    @Transactional
    @Override
    public void leaveChatRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다."));

        // 권한 확인
        validateChatRoomAccess(chatRoom, userId);

        // 발신자만 나가는 경우
        if (chatRoom.getSender().getId().equals(userId)) {
            chatRoom.senderLeave();
        } else if (chatRoom.getReceiver().getId().equals(userId)) {
            // 수신자가 나가는 경우
            chatRoom.receiverLeave();
        }

        // 둘 다 나갔 경우에는 삭제
        if (chatRoom.isSenderLeft() && chatRoom.isReceiverLeft()) {
            chatRoomRepository.delete(chatRoom);
        }

    }
}
