package com.questplatform.sessions.controller;

import com.questplatform.sessions.dto.ObjectInspectResponse;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.service.SessionObjectService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}/objects")
public class SessionObjectController {

    private final SessionObjectService objectService;
    private final SessionService sessionService;

    public SessionObjectController(SessionObjectService objectService,
                                   SessionService sessionService) {
        this.objectService = objectService;
        this.sessionService = sessionService;
    }

    /**
     * Осмотреть объект. Возвращает объект и все его улики, автоматически
     * кладёт их в личный Портфель игрока.
     */
    @PostMapping("/{objectId}/inspect")
    public ResponseEntity<ObjectInspectResponse> inspect(
            @PathVariable UUID sessionId,
            @PathVariable UUID objectId,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        return ResponseEntity.ok(
                objectService.inspect(sessionId, player.getId(), objectId));
    }
}