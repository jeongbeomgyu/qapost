package org.example.onebyte.repository;

import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.User;
import org.example.onebyte.entity.chat.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 게시글 + 발신자 + 수신자 조합으로 기존 방이 있는지 조회
    Optional<ChatRoom> findByBoardAndSenderAndReceiver(Board board, User sender, User receiver);

    // 사용자가 참여 중인 모든 채팅방 목록 조회 (최신 메시지 수신 채팅방 순으로 정렬)
    // 내가 만든 방은 무조건 보이도록 쿼리 추가
    // 받은 방은 메시지가 있어야 보이도록 쿼리 추가
    // 내가 나가지 않은 방만 조회 추가
    @Query("SELECT cr FROM ChatRoom cr " +
            "JOIN FETCH cr.sender JOIN FETCH cr.receiver JOIN FETCH cr.board " +
            "WHERE ( (cr.sender = :user AND cr.senderLeft = false) " +
            "     OR (cr.receiver = :user AND cr.receiverLeft = false AND EXISTS (SELECT 1 FROM ChatMessage m WHERE m.chatRoom = cr)) ) " +
            "ORDER BY cr.lastMessageTime DESC")
    List<ChatRoom> findAllByUser(@Param("user") User user);

    // 사용자가 참여 중이면서, 상대방의 닉네임에 검색어가 포함된 채팅방 목록 조회
    // 조회에도 내가 만든 방은 무조건 검색이 가능하도록 쿼리 추가
    // 받은 방은 메시지가 있어야 상대방 닉네임으로 검색이 가능하도록 쿼리 추가
    // 조회 시 내가 참여 중이면서 내가 나가지 않은 방만 조회
    @Query("SELECT cr FROM ChatRoom cr " +
            "JOIN FETCH cr.sender JOIN FETCH cr.receiver JOIN FETCH cr.board " +
            "WHERE ( (cr.sender = :user AND cr.senderLeft = false) " +
            "     OR (cr.receiver = :user AND cr.receiverLeft = false AND EXISTS (SELECT 1 FROM ChatMessage m WHERE m.chatRoom = cr)) ) " +
            "AND ( (cr.sender != :user AND cr.sender.nickname LIKE %:keyword%) " +
            "      OR (cr.receiver != :user AND cr.receiver.nickname LIKE %:keyword%) ) " +
            "ORDER BY cr.lastMessageTime DESC")
    List<ChatRoom> findAllByUserAndNickname(@Param("user") User user, @Param("keyword") String keyword);
}
