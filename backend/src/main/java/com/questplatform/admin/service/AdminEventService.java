package com.questplatform.admin.service;

import com.questplatform.admin.dto.ConditionWithEventsResponse;
import com.questplatform.admin.dto.CreateConditionRequest;
import com.questplatform.admin.dto.CreateGameEventRequest;
import com.questplatform.admin.dto.UpdateConditionRequest;
import com.questplatform.admin.dto.UpdateGameEventRequest;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.domain.ConditionType;
import com.questplatform.engine.domain.EventType;
import com.questplatform.engine.entity.GameCondition;
import com.questplatform.engine.entity.GameEvent;
import com.questplatform.engine.mapper.GameEventMapper;
import com.questplatform.engine.repository.GameConditionRepository;
import com.questplatform.engine.repository.GameEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminEventService {

    private final GameConditionRepository conditionRepository;
    private final GameEventRepository eventRepository;
    private final CaseRepository caseRepository;
    private final GameEventMapper eventMapper;

    public AdminEventService(GameConditionRepository conditionRepository,
                             GameEventRepository eventRepository,
                             CaseRepository caseRepository,
                             GameEventMapper eventMapper) {
        this.conditionRepository = conditionRepository;
        this.eventRepository = eventRepository;
        this.caseRepository = caseRepository;
        this.eventMapper = eventMapper;
    }

    @Transactional(readOnly = true)
    public List<ConditionWithEventsResponse> listByCase(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        List<GameCondition> conditions = conditionRepository.findByCaseId(caseId);
        List<GameEvent> allEvents = eventRepository.findByCaseIdOrderBySortOrderAsc(caseId);

        var eventsByCondition = allEvents.stream()
                .filter(e -> e.getConditionId() != null)
                .collect(Collectors.groupingBy(GameEvent::getConditionId));

        return conditions.stream()
                .map(c -> new ConditionWithEventsResponse(
                        c.getId(),
                        c.getCaseId(),
                        c.getConditionType(),
                        c.getTargetId(),
                        c.getCreatedAt(),
                        eventMapper.toResponseList(
                                eventsByCondition.getOrDefault(c.getId(), List.of()))
                ))
                .toList();
    }

    @Transactional
    public GameCondition createCondition(UUID caseId, CreateConditionRequest req) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        validateTarget(req.conditionType(), req.targetId());

        GameCondition c = new GameCondition();
        c.setCaseId(caseId);
        c.setConditionType(req.conditionType());
        c.setTargetId(req.targetId());
        return conditionRepository.save(c);
    }

    @Transactional
    public GameCondition updateCondition(UUID id, UpdateConditionRequest req) {
        GameCondition c = conditionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Условие не найдено: " + id));
        validateTarget(req.conditionType(), req.targetId());
        c.setConditionType(req.conditionType());
        c.setTargetId(req.targetId());
        return conditionRepository.save(c);
    }

    @Transactional
    public void deleteCondition(UUID id) {
        GameCondition c = conditionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Условие не найдено: " + id));
        List<GameEvent> events = eventRepository.findByConditionIdOrderBySortOrderAsc(id);
        eventRepository.deleteAll(events);
        conditionRepository.delete(c);
    }

    @Transactional
    public GameEvent createEvent(UUID conditionId, CreateGameEventRequest req) {
        GameCondition c = conditionRepository.findById(conditionId)
                .orElseThrow(() -> new ResourceNotFoundException("Условие не найдено: " + conditionId));
        validateEventTarget(req.eventType(), req.targetId());

        GameEvent e = new GameEvent();
        e.setCaseId(c.getCaseId());
        e.setConditionId(conditionId);
        e.setEventType(req.eventType());
        e.setTargetId(req.targetId());
        e.setMessage(req.message());
        e.setOnce(req.once() != null ? req.once() : true);
        e.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        return eventRepository.save(e);
    }

    @Transactional
    public GameEvent updateEvent(UUID id, UpdateGameEventRequest req) {
        GameEvent e = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Событие не найдено: " + id));
        validateEventTarget(req.eventType(), req.targetId());
        e.setEventType(req.eventType());
        e.setTargetId(req.targetId());
        e.setMessage(req.message());
        e.setOnce(req.once());
        e.setSortOrder(req.sortOrder());
        return eventRepository.save(e);
    }

    @Transactional
    public void deleteEvent(UUID id) {
        GameEvent e = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Событие не найдено: " + id));
        eventRepository.delete(e);
    }

    private void validateTarget(ConditionType type, UUID targetId) {
        if (type == ConditionType.PUZZLE_SOLVED) return;
        if (targetId == null) {
            throw new BusinessException(
                    "Для этого типа условия targetId обязателен", HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Проверка targetId для события.
     *
     * <p>{@code SHOW_MESSAGE} и {@code DISPATCH_CALL} не требуют targetId —
     * они несут только текст. Остальные типы (REVEAL_EVIDENCE,
     * UNLOCK_OBJECT, UNLOCK_LOCATION) требуют ссылку.</p>
     */
    private void validateEventTarget(EventType type, UUID targetId) {
        if (type == EventType.SHOW_MESSAGE) return;
        if (type == EventType.DISPATCH_CALL) return;
        if (targetId == null) {
            throw new BusinessException(
                    "Для этого типа события targetId обязателен", HttpStatus.BAD_REQUEST);
        }
    }
}