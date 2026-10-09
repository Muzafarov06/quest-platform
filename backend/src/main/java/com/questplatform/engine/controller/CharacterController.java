package com.questplatform.engine.controller;

import com.questplatform.engine.dto.CharacterResponse;
import com.questplatform.engine.service.CharacterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class CharacterController {

    private final CharacterService service;

    public CharacterController(CharacterService service) {
        this.service = service;
    }

    /** Персонажи в конкретной локации — используются на сцене. */
    @GetMapping("/api/locations/{locationId}/characters")
    public ResponseEntity<List<CharacterResponse>> listByLocation(@PathVariable UUID locationId) {
        return ResponseEntity.ok(service.listByLocation(locationId));
    }

    /** Все персонажи кейса — админ и отладка. */
    @GetMapping("/api/cases/{caseId}/characters")
    public ResponseEntity<List<CharacterResponse>> listByCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(service.listByCase(caseId));
    }

    /**
     * Персонажи, доступные команде в этой сессии — для «Вызова на допрос».
     * Отдаёт только тех, чьи правила unlock_mode уже сработали.
     */
    @GetMapping("/api/sessions/{sessionId}/characters/available")
    public ResponseEntity<List<CharacterResponse>> listAvailable(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(service.listAvailableForSession(sessionId));
    }

    @GetMapping("/api/characters/{id}")
    public ResponseEntity<CharacterResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }
}