package org.example.onebyte.controller.chat;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.chat.ChatRoomRequest;
import org.example.onebyte.dto.chat.ChatRoomResponse;
import org.example.onebyte.entity.chat.ChatRoom;
import org.example.onebyte.security.CustomUserDetails;
import org.example.onebyte.service.chat.ChatRoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    // 채팅방 생성 요청
    @PostMapping("/room")
    public ResponseEntity<ChatRoomResponse> createRoom(
            @RequestBody ChatRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 채팅방 생성 혹은 호출 서비스 호출 -> 로그인한 유저가 발신자가 돼서 방을 찾거나 검색하는 로직
        ChatRoom chatRoom = chatRoomService.createOrGetChatRoom(request, userDetails.getUserId());

        // 기존 방에 실제 마지막 메시지가 있었는지 확인
        String lastMsg = chatRoomService.getLatestContent(chatRoom.getId());

        // (게시판 상세보기에서) 신규 또는 기존 방에 대해서 조회할 때 마지막 메시지를 확인하고 보냄
        ChatRoomResponse chatRoomResponse = ChatRoomResponse.fromEntity(chatRoom, lastMsg, 0L);


        return ResponseEntity.ok(chatRoomResponse);
    }

    // 로그인한 사용자가 참여 중인 채팅방 목록 조회 (상대방 이름으로 채팅방 조회 -> 키워드가 없으면 그냥 전체 조회)
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(
            @RequestParam(value = "keyword", required = false) String keyword,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        // 내가 sender 이거나 receiver 인 모든 방을 조회
        List<ChatRoomResponse> rooms = chatRoomService.findAllByUserId(userDetails.getUserId(), keyword);

        return ResponseEntity.ok(rooms);
    }

    // 채팅방 나가기
    @DeleteMapping("/room/{roomId}")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        chatRoomService.leaveChatRoom(roomId, userDetails.getUserId());
        return ResponseEntity.noContent().build();
    }
}
