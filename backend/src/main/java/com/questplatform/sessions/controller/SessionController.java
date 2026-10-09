package com.questplatform.sessions.controller;

import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.locations.mapper.LocationMapper;
import com.questplatform.sessions.dto.ChangeAvatarRequest;
import com.questplatform.sessions.dto.CreateSessionRequest;
import com.questplatform.sessions.dto.JoinSessionRequest;
import com.questplatform.sessions.dto.JoinSessionResponse;
import com.questplatform.sessions.dto.MoveRequest;
import com.questplatform.sessions.dto.PlayerMapResponse;
import com.questplatform.sessions.dto.PlayerSceneResponse;
import com.questplatform.sessions.dto.SetReadyRequest;
import com.questplatform.sessions.dto.SessionPlayerResponse;
import com.questplatform.sessions.dto.SessionResponse;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.mapper.SessionMapper;
import com.questplatform.sessions.service.PlayerMapService;
import com.questplatform.sessions.service.PlayerSceneService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final SessionMapper sessionMapper;
    private final LocationMapper locationMapper;
    private final PlayerSceneService playerSceneService;
    private final PlayerMapService playerMapService;

    public SessionController(SessionService sessionService,
                             SessionMapper sessionMapper,
                             LocationMapper locationMapper,
                             PlayerSceneService playerSceneService,
                             PlayerMapService playerMapService) {
        this.sessionService = sessionService;
        this.sessionMapper = sessionMapper;
        this.locationMapper = locationMapper;
        this.playerSceneService = playerSceneService;
        this.playerMapService = playerMapService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody CreateSessionRequest request,
                                                  @AuthenticationPrincipal User owner) {
        GameSession session = sessionService.createSession(request.caseId(), owner);
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionMapper.toResponse(session));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<SessionResponse>> mine(@AuthenticationPrincipal User owner) {
        List<GameSession> sessions = sessionService.getMySessions(owner);
        return ResponseEntity.ok(sessionMapper.toResponseList(sessions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionMapper.toResponse(sessionService.getById(id)));
    }

    @GetMapping("/by-code/{roomCode}")
    public ResponseEntity<SessionResponse> getByCode(@PathVariable String roomCode) {
        return ResponseEntity.ok(sessionMapper.toResponse(sessionService.getByRoomCode(roomCode)));
    }

    @GetMapping("/{id}/players")
    public ResponseEntity<List<SessionPlayerResponse>> players(@PathVariable UUID id) {
        List<SessionPlayer> players = sessionService.getPlayers(id);
        return ResponseEntity.ok(sessionMapper.toPlayerResponseList(players));
    }

    /**
     * Карта дела для игрока.
     *
     * Отдаёт все локации, включая закрытые — закрытые помечены
     * {@code unlocked=false}, фронт рисует их серыми и не пускает внутрь.
     * Игрок должен быть участником сессии.
     */
    @GetMapping("/{sessionId}/map")
    public ResponseEntity<PlayerMapResponse> playerMap(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User user
    ) {
        sessionService.getPlayerForUser(sessionId, user);
        return ResponseEntity.ok(playerMapService.getMap(sessionId));
    }

    /**
     * Удалить сессию. Только владелец и только не-ACTIVE.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User owner
    ) {
        sessionService.deleteSession(id, owner);
        return ResponseEntity.noContent().build();
    }


    /**
     * Исключить игрока из сессии. Только владелец.
     */
    @PostMapping("/{sessionId}/players/{playerId}/kick")
    public ResponseEntity<Void> kick(
            @PathVariable UUID sessionId,
            @PathVariable UUID playerId,
            @AuthenticationPrincipal User owner
    ) {
        sessionService.kickPlayer(sessionId, owner, playerId);
        return ResponseEntity.noContent().build();
    }
    /**
     * Локации, доступные игрокам в этой сессии.
     * Возвращает только открытые — остальные ещё не найдены.
     */
    @GetMapping("/{id}/available-locations")
    public ResponseEntity<List<LocationResponse>> availableLocations(@PathVariable UUID id) {
        var locations = sessionService.getAvailableLocations(id);
        return ResponseEntity.ok(locationMapper.toResponseList(locations));
    }

    /**
     * Сцена локации для игрока.
     *
     * Отдаёт фон + объекты + персонажей + под-локации + переходы.
     * Только если локация уже открыта в этой сессии.
     * Игрок должен быть участником сессии.
     */
    @GetMapping("/{sessionId}/locations/{locationId}/scene")
    public ResponseEntity<PlayerSceneResponse> playerScene(
            @PathVariable UUID sessionId,
            @PathVariable UUID locationId,
            @AuthenticationPrincipal User user
    ) {
        sessionService.getPlayerForUser(sessionId, user);
        return ResponseEntity.ok(playerSceneService.getScene(sessionId, locationId));
    }

    @PostMapping("/by-code/{roomCode}/join")
    public ResponseEntity<JoinSessionResponse> join(
            @PathVariable String roomCode,
            @Valid @RequestBody JoinSessionRequest request,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestTokenHeader,
            @AuthenticationPrincipal User user
    ) {
        UUID guestToken = null;
        if (guestTokenHeader != null && !guestTokenHeader.isBlank()) {
            try {
                guestToken = UUID.fromString(guestTokenHeader);
            } catch (IllegalArgumentException ignored) {
            }
        }
        JoinSessionResponse response = sessionService.joinSession(roomCode, user, request, guestToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<SessionResponse> start(@PathVariable UUID id,
                                                 @AuthenticationPrincipal User owner) {
        GameSession session = sessionService.startSession(id, owner);
        return ResponseEntity.ok(sessionMapper.toResponse(session));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<SessionPlayerResponse> leave(@PathVariable UUID id,
                                                       @AuthenticationPrincipal User user) {
        SessionPlayer player = sessionService.leaveSession(id, user);
        return ResponseEntity.ok(sessionMapper.toPlayerResponse(player));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<SessionResponse> close(@PathVariable UUID id,
                                                 @AuthenticationPrincipal User owner) {
        GameSession session = sessionService.closeSession(id, owner);
        return ResponseEntity.ok(sessionMapper.toResponse(session));
    }

    @PostMapping("/{id}/lobby/move")
    public ResponseEntity<Void> move(
            @PathVariable UUID id,
            @Valid @RequestBody MoveRequest request,
            @AuthenticationPrincipal User user
    ) {
        sessionService.movePlayer(id, user, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/players/me/avatar")
    public ResponseEntity<SessionPlayerResponse> changeAvatar(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeAvatarRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.changeAvatar(id, user, request.avatarKey());
        return ResponseEntity.ok(sessionMapper.toPlayerResponse(player));
    }

    /** Готовность игрока. Когда все активные готовы — сессия стартует сама. */
    @PatchMapping("/{id}/players/me/ready")
    public ResponseEntity<SessionPlayerResponse> setReady(
            @PathVariable UUID id,
            @Valid @RequestBody SetReadyRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.setReady(id, user, request.ready());
        return ResponseEntity.ok(sessionMapper.toPlayerResponse(player));
    }
}