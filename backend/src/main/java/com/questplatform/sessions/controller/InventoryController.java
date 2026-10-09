package com.questplatform.sessions.controller;

import com.questplatform.sessions.entity.PlayerInventoryItem;
import com.questplatform.sessions.entity.SessionDiscoveredEvidence;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.service.InventoryService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}")
public class InventoryController {

    private final InventoryService inventoryService;
    private final SessionService sessionService;

    public InventoryController(InventoryService inventoryService, SessionService sessionService) {
        this.inventoryService = inventoryService;
        this.sessionService = sessionService;
    }

    /** Мой инвентарь. */
    @GetMapping("/inventory")
    public ResponseEntity<List<PlayerInventoryItem>> myInventory(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        return ResponseEntity.ok(inventoryService.getMyInventory(sessionId, player.getId()));
    }

    /** Взять улику в сумку. */
    @PostMapping("/inventory/{evidenceId}")
    public ResponseEntity<PlayerInventoryItem> take(
            @PathVariable UUID sessionId,
            @PathVariable UUID evidenceId,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        PlayerInventoryItem item = inventoryService.takeToInventory(sessionId, player.getId(), evidenceId);
        return ResponseEntity.ok(item);
    }

    /** Улики, найденные командой. */
    @GetMapping("/discovered")
    public ResponseEntity<List<SessionDiscoveredEvidence>> discovered(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(inventoryService.getTeamDiscovered(sessionId));
    }
}