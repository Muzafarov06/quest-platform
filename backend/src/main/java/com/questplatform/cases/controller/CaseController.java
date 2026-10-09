package com.questplatform.cases.controller;

import com.questplatform.cases.dto.CaseResponse;
import com.questplatform.cases.entity.Case;
import com.questplatform.cases.mapper.CaseMapper;
import com.questplatform.cases.service.CaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseService caseService;
    private final CaseMapper caseMapper;

    public CaseController(CaseService caseService, CaseMapper caseMapper) {
        this.caseService = caseService;
        this.caseMapper = caseMapper;
    }

    @GetMapping
    public ResponseEntity<List<CaseResponse>> listPublished() {
        List<Case> cases = caseService.getPublishedCases();
        return ResponseEntity.ok(caseMapper.toResponseList(cases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getById(@PathVariable UUID id) {
        Case c = caseService.getById(id);
        return ResponseEntity.ok(caseMapper.toResponse(c));
    }
}