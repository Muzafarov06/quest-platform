package com.questplatform.admin.controller;

import com.questplatform.engine.dto.CreateFinalQuestionRequest;
import com.questplatform.engine.dto.FinalQuestionAdminResponse;
import com.questplatform.engine.dto.UpdateFinalQuestionRequest;
import com.questplatform.engine.entity.FinalQuestion;
import com.questplatform.engine.mapper.FinalQuestionMapper;
import com.questplatform.engine.service.FinalQuestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFinalQuestionController {

    private final FinalQuestionService service;
    private final FinalQuestionMapper mapper;

    public AdminFinalQuestionController(FinalQuestionService service, FinalQuestionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/cases/{caseId}/final-question")
    public ResponseEntity<FinalQuestionAdminResponse> getByCase(@PathVariable UUID caseId) {
        FinalQuestion q = service.getByCaseId(caseId);
        if (q == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(mapper.toAdminResponse(q));
    }

    @PostMapping("/cases/{caseId}/final-question")
    public ResponseEntity<FinalQuestionAdminResponse> createOrUpdate(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateFinalQuestionRequest req
    ) {
        FinalQuestion q = service.createOrUpdate(caseId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toAdminResponse(q));
    }

    @PutMapping("/final-question/{id}")
    public ResponseEntity<FinalQuestionAdminResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFinalQuestionRequest req
    ) {
        return ResponseEntity.ok(mapper.toAdminResponse(service.update(id, req)));
    }

    @DeleteMapping("/final-question/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}