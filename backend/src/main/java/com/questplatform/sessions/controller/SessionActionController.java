package com.questplatform.sessions.controller;

import com.questplatform.engine.dto.ActionRequest;
import com.questplatform.engine.dto.GameEventResponse;
import com.questplatform.engine.dto.SessionActionRequest;
import com.questplatform.engine.dto.SessionActionResponse;
import com.questplatform.engine.entity.GameEvent;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.engine.mapper.GameEventMapper;
import com.questplatform.engine.service.EngineService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}/actions")
public class SessionActionController {

    private final EngineService engineService;
    private final SessionService sessionService;
    private final GameEventMapper gameEventMapper;

    public SessionActionController(EngineService engineService,
                                   SessionService sessionService,
                                   GameEventMapper gameEventMapper) {
        this.engineService = engineService;
        this.sessionService = sessionService;
        this.gameEventMapper = gameEventMapper;
    }

    @PostMapping
    public ResponseEntity<SessionActionResponse> act(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SessionActionRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        List<GameEvent> events = engineService.handleAction(
                sessionId,
                player.getId(),
                new ActionRequest(request.actionType(), request.targetId())
        );
        List<GameEventResponse> mapped = gameEventMapper.toResponseList(events);
        return ResponseEntity.ok(new SessionActionResponse(mapped));
    }
}