package com.questplatform.admin.controller;

import com.questplatform.admin.dto.ConditionWithEventsResponse;
import com.questplatform.admin.dto.CreateConditionRequest;
import com.questplatform.admin.dto.CreateGameEventRequest;
import com.questplatform.admin.dto.UpdateConditionRequest;
import com.questplatform.admin.dto.UpdateGameEventRequest;
import com.questplatform.admin.service.AdminEventService;
import com.questplatform.engine.dto.GameEventResponse;
import com.questplatform.engine.entity.GameCondition;
import com.questplatform.engine.entity.GameEvent;
import com.questplatform.engine.mapper.GameEventMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventController {

    private final AdminEventService service;
    private final GameEventMapper eventMapper;

    public AdminEventController(AdminEventService service, GameEventMapper eventMapper) {
        this.service = service;
        this.eventMapper = eventMapper;
    }

    @GetMapping("/cases/{caseId}/conditions")
    public ResponseEntity<List<ConditionWithEventsResponse>> listByCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(service.listByCase(caseId));
    }

    @PostMapping("/cases/{caseId}/conditions")
    public ResponseEntity<ConditionWithEventsResponse> createCondition(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateConditionRequest req
    ) {
        GameCondition c = service.createCondition(caseId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ConditionWithEventsResponse(
                        c.getId(), c.getCaseId(), c.getConditionType(),
                        c.getTargetId(), c.getCreatedAt(), List.of())
        );
    }

    @PutMapping("/conditions/{id}")
    public ResponseEntity<ConditionWithEventsResponse> updateCondition(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConditionRequest req
    ) {
        GameCondition c = service.updateCondition(id, req);
        return ResponseEntity.ok(new ConditionWithEventsResponse(
                c.getId(), c.getCaseId(), c.getConditionType(),
                c.getTargetId(), c.getCreatedAt(), List.of()));
    }

    @DeleteMapping("/conditions/{id}")
    public ResponseEntity<Void> deleteCondition(@PathVariable UUID id) {
        service.deleteCondition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conditions/{conditionId}/events")
    public ResponseEntity<GameEventResponse> createEvent(
            @PathVariable UUID conditionId,
            @Valid @RequestBody CreateGameEventRequest req
    ) {
        GameEvent e = service.createEvent(conditionId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(eventMapper.toResponse(e));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<GameEventResponse> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGameEventRequest req
    ) {
        return ResponseEntity.ok(eventMapper.toResponse(service.updateEvent(id, req)));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        service.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}