package com.questplatform.cases.service;

import com.questplatform.cases.domain.CaseStatus;
import com.questplatform.cases.entity.Case;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CaseService {

    private final CaseRepository caseRepository;

    public CaseService(CaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    /**
     * Список опубликованных кейсов — для каталога.
     */
    @Transactional(readOnly = true)
    public List<Case> getPublishedCases() {
        return caseRepository.findByStatus(CaseStatus.PUBLISHED);
    }

    /**
     * Кейс по ID. Если не найден — 404.
     */
    @Transactional(readOnly = true)
    public Case getById(UUID id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Кейс не найден: " + id));
    }

    /**
     * Кейс по коду (CASE-001).
     */
    @Transactional(readOnly = true)
    public Case getByCode(String code) {
        return caseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Кейс не найден: " + code));
    }
}