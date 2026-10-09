package com.questplatform.engine.service;

import com.questplatform.engine.domain.EventType;
import com.questplatform.engine.dto.ActionRequest;
import com.questplatform.engine.entity.GameCondition;
import com.questplatform.engine.entity.GameEvent;
import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.entity.SessionAction;
import com.questplatform.engine.repository.GameConditionRepository;
import com.questplatform.engine.repository.GameEventRepository;
import com.questplatform.sessions.repository.SessionActionRepository;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.sessions.service.LocationDiscoveryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EngineService {

    private final GameConditionRepository conditionRepository;
    private final GameEventRepository eventRepository;
    private final SessionActionRepository actionRepository;
    private final SessionEventPublisher eventPublisher;
    private final LocationDiscoveryService locationDiscoveryService;
    private final LocationRepository locationRepository;

    public EngineService(GameConditionRepository conditionRepository,
                         GameEventRepository eventRepository,
                         SessionActionRepository actionRepository,
                         SessionEventPublisher eventPublisher,
                         LocationDiscoveryService locationDiscoveryService,
                         LocationRepository locationRepository) {
        this.conditionRepository = conditionRepository;
        this.eventRepository = eventRepository;
        this.actionRepository = actionRepository;
        this.eventPublisher = eventPublisher;
        this.locationDiscoveryService = locationDiscoveryService;
        this.locationRepository = locationRepository;
    }

    @Transactional
    public List<GameEvent> handleAction(UUID sessionId, UUID playerId, ActionRequest request) {
        List<GameCondition> conditions = conditionRepository.findAll().stream()
                .filter(c -> c.getConditionType() == request.actionType())
                .filter(c -> {
                    if (request.targetId() == null) return c.getTargetId() == null;
                    return request.targetId().equals(c.getTargetId());
                })
                .toList();

        if (conditions.isEmpty()) {
            saveActionIfSession(sessionId, playerId, request);
            // Триггеры открытия локаций всё равно проверяем — они могут быть
            // привязаны к действию, для которого нет условий/событий.
            handleDiscoveryTriggers(sessionId, playerId, request);
            return List.of();
        }

        List<UUID> conditionIds = conditions.stream().map(GameCondition::getId).toList();

        List<GameEvent> events = eventRepository.findAll().stream()
                .filter(e -> e.getConditionId() != null && conditionIds.contains(e.getConditionId()))
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();

        if (sessionId != null) {
            events = events.stream()
                    .filter(e -> {
                        if (!e.isOnce()) return true;
                        return !actionRepository.existsBySessionIdAndActionTypeAndTargetId(
                                sessionId, request.actionType(), request.targetId()
                        );
                    })
                    .toList();
        }

        saveActionIfSession(sessionId, playerId, request);

        // Broadcast сработавших событий всем подписчикам сессии
        if (sessionId != null && !events.isEmpty()) {
            for (GameEvent e : events) {
                eventPublisher.gameEventTriggered(sessionId, e);
            }
        }

        // Событие UNLOCK_LOCATION — открыть конкретную локацию вручную.
        if (sessionId != null) {
            for (GameEvent e : events) {
                if (e.getEventType() == EventType.UNLOCK_LOCATION && e.getTargetId() != null) {
                    locationRepository.findById(e.getTargetId()).ifPresent(loc ->
                            locationDiscoveryService.unlock(sessionId, loc, playerId));
                }
            }
        }

        // Триггеры открытия локаций по типу действия.
        handleDiscoveryTriggers(sessionId, playerId, request);

        return events;
    }

    /**
     * Открывает локации, привязанные к этому действию.
     *
     * <p>Сейчас поддержаны два вида триггера:
     * <ul>
     *   <li>{@code EVIDENCE_DISCOVERED} → ON_EVIDENCE</li>
     *   <li>{@code LOCATION_VISITED}    → ON_LOCATION</li>
     * </ul>
     * ON_DIALOG будет добавлен отдельно, когда появится событие «диалог
     * с персонажем».</p>
     */
    private void handleDiscoveryTriggers(UUID sessionId, UUID playerId, ActionRequest request) {
        if (sessionId == null || request.targetId() == null) return;

        switch (request.actionType()) {
            case EVIDENCE_DISCOVERED ->
                    locationDiscoveryService.onTrigger(
                            sessionId, DiscoveryMode.ON_EVIDENCE,
                            request.targetId(), playerId);
            case LOCATION_VISITED ->
                    locationDiscoveryService.onTrigger(
                            sessionId, DiscoveryMode.ON_LOCATION,
                            request.targetId(), playerId);
            default -> { /* OBJECT_INTERACTED, PUZZLE_SOLVED — не триггерят открытие */ }
        }
    }

    private void saveActionIfSession(UUID sessionId, UUID playerId, ActionRequest request) {
        if (sessionId == null || playerId == null) return;
        if (actionRepository.existsBySessionIdAndActionTypeAndTargetId(
                sessionId, request.actionType(), request.targetId())) {
            return;
        }
        SessionAction action = new SessionAction();
        action.setSessionId(sessionId);
        action.setPlayerId(playerId);
        action.setActionType(request.actionType());
        action.setTargetId(request.targetId());
        actionRepository.save(action);
    }
}