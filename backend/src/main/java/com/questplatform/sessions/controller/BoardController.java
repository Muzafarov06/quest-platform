package com.questplatform.sessions.controller;

import com.questplatform.sessions.dto.BoardConnectionResponse;
import com.questplatform.sessions.dto.BoardItemRequest;
import com.questplatform.sessions.dto.BoardItemResponse;
import com.questplatform.sessions.dto.BoardNoteRequest;
import com.questplatform.sessions.dto.BoardNoteResponse;
import com.questplatform.sessions.entity.BoardConnection;
import com.questplatform.sessions.entity.BoardItem;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.mapper.BoardMapper;
import com.questplatform.sessions.service.BoardService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}/board")
public class BoardController {

    private final BoardService boardService;
    private final SessionService sessionService;
    private final BoardMapper boardMapper;

    public BoardController(BoardService boardService,
                           SessionService sessionService,
                           BoardMapper boardMapper) {
        this.boardService = boardService;
        this.sessionService = sessionService;
        this.boardMapper = boardMapper;
    }

    @GetMapping("/items")
    public ResponseEntity<List<BoardItemResponse>> items(@PathVariable UUID sessionId) {
        List<BoardItem> items = boardService.getItems(sessionId);
        Map<UUID, String> names = boardService.getAuthorNames(sessionId);
        return ResponseEntity.ok(boardMapper.toItemResponseList(items, names));
    }

    @GetMapping("/connections")
    public ResponseEntity<List<BoardConnectionResponse>> connections(@PathVariable UUID sessionId) {
        List<BoardConnection> connections = boardService.getConnections(sessionId);
        return ResponseEntity.ok(boardMapper.toConnectionResponseList(connections));
    }

    @PostMapping("/items")
    public ResponseEntity<BoardItemResponse> addItem(
            @PathVariable UUID sessionId,
            @Valid @RequestBody BoardItemRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        BoardItem item = boardService.addItem(sessionId, player.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boardMapper.toItemResponse(item, player.getDisplayName()));
    }

    /** Передвинуть карточку. Realtime: разлетается всем через WS. */
    @PatchMapping("/items/{itemId}/position")
    public ResponseEntity<BoardItemResponse> moveItem(
            @PathVariable UUID sessionId,
            @PathVariable UUID itemId,
            @Valid @RequestBody MoveBoardItemRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        BoardItem item = boardService.moveItem(sessionId, itemId, request.posX(), request.posY());
        return ResponseEntity.ok(boardMapper.toItemResponse(item, player.getDisplayName()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable UUID sessionId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user
    ) {
        sessionService.getPlayerForUser(sessionId, user);
        boardService.deleteItem(sessionId, itemId);
        return ResponseEntity.noContent().build();
    }

    /* ---------- Общая заметка ---------- */

    @GetMapping("/note")
    public ResponseEntity<BoardNoteResponse> getNote(@PathVariable UUID sessionId) {
        String text = boardService.getNoteText(sessionId);
        return ResponseEntity.ok(new BoardNoteResponse(text, null, null));
    }

    @PatchMapping("/note")
    public ResponseEntity<BoardNoteResponse> updateNote(
            @PathVariable UUID sessionId,
            @Valid @RequestBody BoardNoteRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        boardService.updateNote(sessionId, player.getId(), request.text());
        return ResponseEntity.ok(new BoardNoteResponse(
                request.text(), player.getDisplayName(), java.time.Instant.now()));
    }

    /* ---------- DTO ---------- */

    public record MoveBoardItemRequest(
            @jakarta.validation.constraints.NotNull Float posX,
            @jakarta.validation.constraints.NotNull Float posY
    ) {}
}