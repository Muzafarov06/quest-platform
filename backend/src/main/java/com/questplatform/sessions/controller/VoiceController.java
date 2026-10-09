package com.questplatform.sessions.controller;

import com.questplatform.common.config.LiveKitProperties;
import com.questplatform.sessions.dto.VoiceTokenResponse;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.service.LiveKitTokenService;
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
@RequestMapping("/api/sessions/{sessionId}/voice")
public class VoiceController {

    private final SessionService sessionService;
    private final LiveKitTokenService tokenService;
    private final LiveKitProperties props;

    public VoiceController(SessionService sessionService,
                           LiveKitTokenService tokenService,
                           LiveKitProperties props) {
        this.sessionService = sessionService;
        this.tokenService = tokenService;
        this.props = props;
    }

    @PostMapping("/token")
    public ResponseEntity<VoiceTokenResponse> token(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        String identity = player.getId().toString();
        String roomName = sessionId.toString();
        String token = tokenService.createToken(identity, player.getDisplayName(), roomName);

        return ResponseEntity.ok(new VoiceTokenResponse(
                props.getUrl(),
                token,
                roomName,
                identity
        ));
    }
}