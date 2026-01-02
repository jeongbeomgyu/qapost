package org.example.onebyte.repository;

import org.example.onebyte.entity.chat.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 대화 내역 조회 -> 특정 채팅방의 메시지를 최신순으로 잘라서 조회 (slice 를 크게 잡아서 전체 조회도 가능)
    // Slice 를 사용하면 전체 카운트 쿼리 없이 성능을 최적화 시킬 수 있는 장점이 있다.
    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender WHERE m.chatRoom.id = :roomId ORDER BY m.sendTime DESC")
    Slice<ChatMessage> findChatMessagesByChatRoomId(@Param("roomId") Long roomId, Pageable pageable);


    // 안 읽은 메시지 조회 -> 읽음 처리 하기 위해서
    // 내가 아닌 상대방이 보낸 안 읽은 메시지 목록 가져오기
    // 2. 안 읽은 메시지 조회: 내가 아닌 상대방이 보낸 것만 추출
    @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false")
    List<ChatMessage> findUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);


    // 채팅방 목록 미리보기 (마지막 메시지 내용 조회) -> String 을 조회
    // DTO 에서 마지막 메시지 한 줄을 보여줄 때 사용 -> 가장 최신 메시지 1 개의 내용만 조회
    @Query("SELECT m.content FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.sendTime DESC")
    Slice<String> findLatestMessageContent(@Param("roomId") Long roomId, Pageable pageable);

    // 마지막 메시지 엔티티 1개를 조회하는 것을 추가
    @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.sendTime DESC")
    Slice<ChatMessage> findLatestMessage(@Param("roomId") Long roomId, Pageable pageable);

    // 특정 방에서 내가(userId) 안 읽은 메시지가 몇 개인지 카운트
    @Query("SELECT COUNT(m) FROM ChatMessage m " + "WHERE m.chatRoom.id = :roomId " + "AND m.sender.id != :userId " + "AND m.isRead = false")
    Long countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);



}
