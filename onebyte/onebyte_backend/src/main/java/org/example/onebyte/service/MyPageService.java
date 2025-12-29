package org.example.onebyte.service;

import org.example.onebyte.dto.board.BoardResponse;
import org.example.onebyte.dto.comment.CommentResponse;
import org.example.onebyte.dto.mypage.MyPageInfoResponse;
import org.example.onebyte.dto.mypage.UpdateInfoRequest;
import org.example.onebyte.dto.mypage.UpdatePasswordRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MyPageService {
    //정보조회
    MyPageInfoResponse getInfo(Long userId);

    //이름, 닉네임 변경
    void updateInfo(Long userId, UpdateInfoRequest request);

    //비밀번호 변경
    void updatePassword(Long userId, UpdatePasswordRequest request);

    //회원탈퇴
    void withdraw(Long userId);

    //내 게시물 조회
    List<BoardResponse> listMyBoards(Long userId, Pageable pageable);

    //추가
    //마이 페이지 관련 : 사용자가 작성한 댓글 조회ㅣ
    public List<CommentResponse> listMyComments(Long userId, Pageable pageable);
}