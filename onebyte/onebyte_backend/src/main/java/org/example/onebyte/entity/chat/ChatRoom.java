package org.example.onebyte.entity.chat;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.example.onebyte.entity.Board;
import org.example.onebyte.entity.User;

import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@Getter
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.MERGE)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.MERGE)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    // 게시글과 이어진 채팅
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    // 마지막 메시지 전송 시간 (가장 최근에 메시지를 받은 채팅방이 맨 위에 나타나게 하기 위한 필드)
    private LocalDateTime lastMessageTime;

    // 나간 유저 채크 필드
    private boolean senderLeft = false;
    private boolean receiverLeft = false;

    @Builder
    public ChatRoom(Board board, User sender, User receiver) {
        this.board = board;
        this.sender = sender;
        this.receiver = receiver;
        this.lastMessageTime = LocalDateTime.now();
    }

    // 메시지가 전송될 때마다 시간을 업데이트하는 메소드
    public void updateLastMessageTime() {
        this.lastMessageTime = LocalDateTime.now();
    }

    // sender 퇴장
    public void senderLeave() {
        this.senderLeft = true;
    }

    public void receiverLeave() {
        this.receiverLeft = true;
    }

    // 누군가 메시지를 보내면 다시 방이 보이도록
    public void resetLeftStatus() {
        this.senderLeft = false;
        this.receiverLeft = false;
    }


}
