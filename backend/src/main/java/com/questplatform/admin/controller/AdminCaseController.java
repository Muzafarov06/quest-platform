package com.questplatform.admin.controller;

import com.questplatform.admin.dto.CaseDeleteInfo;
import com.questplatform.admin.dto.CreateCaseRequest;
import com.questplatform.admin.dto.UpdateCaseRequest;
import com.questplatform.admin.service.AdminCaseService;
import com.questplatform.cases.dto.CaseResponse;
import com.questplatform.cases.entity.Case;
import com.questplatform.cases.mapper.CaseMapper;
import com.questplatform.sessions.dto.SessionResponse;
import com.questplatform.sessions.mapper.SessionMapper;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.Map;

/**
 * Админский CRUD кейсов (только метаданные).
 *
 * <p>Отделён от публичного {@code CaseController} (в {@code cases}):
 * публичный отдаёт только PUBLISHED, админский — все статусы.
 * Разные DTO на запись, разные права.</p>
 */
@RestController
@RequestMapping("/api/admin/cases")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCaseController {

    private final AdminCaseService adminCaseService;
    private final CaseMapper caseMapper;
    private final SessionService sessionService;
    private final SessionMapper sessionMapper;

    public AdminCaseController(AdminCaseService adminCaseService,
                               CaseMapper caseMapper,
                               SessionService sessionService,
                               SessionMapper sessionMapper) {
        this.adminCaseService = adminCaseService;
        this.caseMapper = caseMapper;
        this.sessionService = sessionService;
        this.sessionMapper = sessionMapper;
    }

    @GetMapping("/next-code")
    public ResponseEntity<Map<String, String>> nextCode() {
        String code = adminCaseService.generateNextCode();
        return ResponseEntity.ok(Map.of("code", code));
    }

    @GetMapping
    public ResponseEntity<List<CaseResponse>> listAll() {
        List<Case> cases = adminCaseService.getAllCases();
        return ResponseEntity.ok(caseMapper.toResponseList(cases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getById(@PathVariable UUID id) {
        Case c = adminCaseService.getById(id);
        return ResponseEntity.ok(caseMapper.toResponse(c));
    }

    @PostMapping
    public ResponseEntity<CaseResponse> create(
            @Valid @RequestBody CreateCaseRequest request,
            @AuthenticationPrincipal User user
    ) {
        Case created = adminCaseService.createCase(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(caseMapper.toResponse(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaseResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCaseRequest request
    ) {
        Case updated = adminCaseService.updateCase(id, request);
        return ResponseEntity.ok(caseMapper.toResponse(updated));
    }

    @PostMapping("/{id}/test-session")
    public ResponseEntity<SessionResponse> startTestSession(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        var session = sessionService.createTestSession(id, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionMapper.toResponse(session));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<CaseResponse> publish(@PathVariable UUID id) {
        Case c = adminCaseService.publish(id);
        return ResponseEntity.ok(caseMapper.toResponse(c));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<CaseResponse> unpublish(@PathVariable UUID id) {
        Case c = adminCaseService.unpublish(id);
        return ResponseEntity.ok(caseMapper.toResponse(c));
    }

    /**
     * Информация о зависимостях перед удалением кейса.
     * Показывает, что удалится, что помешает.
     */
    @GetMapping("/{id}/delete-info")
    public ResponseEntity<CaseDeleteInfo> deleteInfo(@PathVariable UUID id) {
        return ResponseEntity.ok(adminCaseService.getDeleteInfo(id));
    }

    /**
     * Удалить кейс. Только если у него нет сессий.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        adminCaseService.deleteCase(id);
        return ResponseEntity.noContent().build();
    }
}