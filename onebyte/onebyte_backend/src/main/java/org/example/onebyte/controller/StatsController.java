package org.example.onebyte.controller;

import lombok.RequiredArgsConstructor;
import org.example.onebyte.dto.stats.CommunityStatsResponse;
import org.example.onebyte.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/community")
    public CommunityStatsResponse getCommunityStats() {
        return statsService.getCommunityStats();
    }
}
