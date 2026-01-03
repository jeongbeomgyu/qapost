package org.example.onebyte.service;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.stats.CommunityStatsResponse;
import org.example.onebyte.repository.BoardRepository;
import org.example.onebyte.repository.UserRepository;
import org.example.onebyte.type.UserStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    public CommunityStatsResponse getCommunityStats() {
        long totalBoards = boardRepository.count();

        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        long todayBoards = boardRepository.countByCreatedAtBetween(start, end);

        return new CommunityStatsResponse(totalBoards, activeUsers, todayBoards);
    }
}
