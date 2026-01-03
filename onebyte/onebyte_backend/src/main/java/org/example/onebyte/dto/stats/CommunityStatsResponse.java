package org.example.onebyte.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommunityStatsResponse {
    private long totalBoards;     // 전체 게시글 수
    private long activeUsers;     // 활성 회원 수
    private long todayBoards;     // 오늘 작성글 수
}