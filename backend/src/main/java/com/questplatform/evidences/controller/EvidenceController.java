package com.questplatform.evidences.controller;

import com.questplatform.evidences.dto.EvidenceResponse;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.mapper.EvidenceMapper;
import com.questplatform.evidences.service.EvidenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class EvidenceController {

    private final EvidenceService evidenceService;
    private final EvidenceMapper evidenceMapper;

    public EvidenceController(EvidenceService evidenceService, EvidenceMapper evidenceMapper) {
        this.evidenceService = evidenceService;
        this.evidenceMapper = evidenceMapper;
    }

    @GetMapping("/api/cases/{caseId}/evidences")
    public ResponseEntity<List<EvidenceResponse>> listByCase(@PathVariable UUID caseId) {
        List<Evidence> evidences = evidenceService.getByCaseId(caseId);
        return ResponseEntity.ok(evidenceMapper.toResponseList(evidences));
    }

    @GetMapping("/api/objects/{objectId}/evidences")
    public ResponseEntity<List<EvidenceResponse>> listByObject(@PathVariable UUID objectId) {
        List<Evidence> evidences = evidenceService.getByObjectId(objectId);
        return ResponseEntity.ok(evidenceMapper.toResponseList(evidences));
    }

    @GetMapping("/api/locations/{locationId}/evidences")
    public ResponseEntity<List<EvidenceResponse>> listByLocation(@PathVariable UUID locationId) {
        List<Evidence> evidences = evidenceService.getByLocationId(locationId);
        return ResponseEntity.ok(evidenceMapper.toResponseList(evidences));
    }

    @GetMapping("/api/evidences/{id}")
    public ResponseEntity<EvidenceResponse> getById(@PathVariable UUID id) {
        Evidence e = evidenceService.getById(id);
        return ResponseEntity.ok(evidenceMapper.toResponse(e));
    }
}