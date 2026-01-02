package org.example.onebyte.entity.chat;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.example.onebyte.entity.User;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)  // 생성 시간 자동 기록
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    // 메시지 내용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 전송 시각
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime sendTime;

    // 읽음 여부
    @Column(nullable = false)
    private boolean isRead;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinColumn(name = "sender_id")
    private User sender;

    // 삭제 여부 필드 추가 (메시지 자체 삭제 X, "삭제된 메시지라고 표시")
    private boolean isDeleted = false;

    @Builder
    public ChatMessage(ChatRoom chatRoom, User sender, String content) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.content = content;
        this.isRead = false;
    }

    // 메시지 읽음 표시
    public void markAsRead() {
        this.isRead = true;
    }

    // 메시지 수정(setter 대신)
    public void updateContent(String content) {
        this.content = content;
    }

    // 메시지 삭제
    public void deleteMessage() {
        this.isDeleted = true;
    }


}
