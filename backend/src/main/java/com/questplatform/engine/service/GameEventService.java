package com.questplatform.engine.service;

import com.questplatform.engine.entity.GameEvent;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.engine.repository.GameEventRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GameEventService {

    private final GameEventRepository eventRepository;
    private final CaseRepository caseRepository;

    public GameEventService(GameEventRepository eventRepository, CaseRepository caseRepository) {
        this.eventRepository = eventRepository;
        this.caseRepository = caseRepository;
    }

    /**
     * Все события кейса. Полезно для админки и отладки.
     */
    @Transactional(readOnly = true)
    public List<GameEvent> getByCaseId(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return eventRepository.findByCaseIdOrderBySortOrderAsc(caseId);
    }
}