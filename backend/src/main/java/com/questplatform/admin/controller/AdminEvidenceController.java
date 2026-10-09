package com.questplatform.admin.controller;

import com.questplatform.admin.dto.CreateEvidenceRequest;
import com.questplatform.admin.dto.UpdateEvidenceRequest;
import com.questplatform.admin.service.AdminEvidenceService;
import com.questplatform.evidences.dto.EvidenceResponse;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.mapper.EvidenceMapper;
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
public class AdminEvidenceController {

    private final AdminEvidenceService service;
    private final EvidenceMapper mapper;

    public AdminEvidenceController(AdminEvidenceService service, EvidenceMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/cases/{caseId}/evidences")
    public ResponseEntity<List<EvidenceResponse>> listByCase(@PathVariable UUID caseId) {
        List<Evidence> list = service.listByCase(caseId);
        return ResponseEntity.ok(mapper.toResponseList(list));
    }

    @GetMapping("/evidences/{id}")
    public ResponseEntity<EvidenceResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(mapper.toResponse(service.getById(id)));
    }

    @PostMapping("/cases/{caseId}/evidences")
    public ResponseEntity<EvidenceResponse> create(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateEvidenceRequest req
    ) {
        Evidence created = service.create(caseId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(created));
    }

    @PutMapping("/evidences/{id}")
    public ResponseEntity<EvidenceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEvidenceRequest req
    ) {
        return ResponseEntity.ok(mapper.toResponse(service.update(id, req)));
    }

    @DeleteMapping("/evidences/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}