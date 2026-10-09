package com.questplatform.engine.controller;

import com.questplatform.engine.dto.GameEventResponse;
import com.questplatform.engine.entity.GameEvent;
import com.questplatform.engine.mapper.GameEventMapper;
import com.questplatform.engine.service.GameEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class GameEventController {

    private final GameEventService gameEventService;
    private final GameEventMapper gameEventMapper;

    public GameEventController(GameEventService gameEventService, GameEventMapper gameEventMapper) {
        this.gameEventService = gameEventService;
        this.gameEventMapper = gameEventMapper;
    }

    @GetMapping("/api/cases/{caseId}/events")
    public ResponseEntity<List<GameEventResponse>> listByCase(@PathVariable UUID caseId) {
        List<GameEvent> events = gameEventService.getByCaseId(caseId);
        return ResponseEntity.ok(gameEventMapper.toResponseList(events));
    }
}