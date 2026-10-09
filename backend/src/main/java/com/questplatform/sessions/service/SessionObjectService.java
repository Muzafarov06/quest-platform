package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.domain.ConditionType;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.sessions.dto.ObjectInspectResponse;
import com.questplatform.sessions.entity.PlayerInventoryItem;
import com.questplatform.sessions.entity.SessionDiscoveredEvidence;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.event.EngineActionEvent;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.sessions.repository.PlayerInventoryRepository;
import com.questplatform.sessions.repository.SessionDiscoveredEvidenceRepository;
import com.questplatform.sessions.repository.SessionPlayerRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Осмотр объекта в сессии.
 *
 * <p>Только БД. Ни движок, ни открытие локаций здесь НЕ вызываются —
 * они запускаются после коммита через {@code ApplicationEventPublisher}.
 * Это защищает факт находки улики от отката при ошибках движка.</p>
 */
@Service
public class SessionObjectService {

    private final GameObjectRepository objectRepo;
    private final EvidenceRepository evidenceRepo;
    private final SessionPlayerRepository playerRepo;
    private final SessionDiscoveredEvidenceRepository discoveredRepo;
    private final PlayerInventoryRepository inventoryRepo;
    private final SessionEventPublisher eventPublisher;
    private final ApplicationEventPublisher springEvents;

    public SessionObjectService(GameObjectRepository objectRepo,
                                EvidenceRepository evidenceRepo,
                                SessionPlayerRepository playerRepo,
                                SessionDiscoveredEvidenceRepository discoveredRepo,
                                PlayerInventoryRepository inventoryRepo,
                                SessionEventPublisher eventPublisher,
                                ApplicationEventPublisher springEvents) {
        this.objectRepo = objectRepo;
        this.evidenceRepo = evidenceRepo;
        this.playerRepo = playerRepo;
        this.discoveredRepo = discoveredRepo;
        this.inventoryRepo = inventoryRepo;
        this.eventPublisher = eventPublisher;
        this.springEvents = springEvents;
    }

    @Transactional
    public ObjectInspectResponse inspect(UUID sessionId, UUID playerId, UUID objectId) {
        GameObject object = objectRepo.findById(objectId)
                .orElseThrow(() -> new ResourceNotFoundException("Объект не найден: " + objectId));

        SessionPlayer player = playerRepo.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Игрок не найден: " + playerId));
        if (!player.getSessionId().equals(sessionId)) {
            throw new BusinessException("Игрок не в этой сессии", HttpStatus.FORBIDDEN);
        }

        List<Evidence> evidences =
                evidenceRepo.findByObjectIdOrderBySortOrderAscTitleAsc(objectId);
        List<UUID> evidenceIds = evidences.stream().map(Evidence::getId).toList();

        Map<UUID, SessionDiscoveredEvidence> discoveredByEvidence =
                evidenceIds.isEmpty()
                        ? Map.of()
                        : discoveredRepo
                        .findBySessionIdAndEvidenceIdIn(sessionId, evidenceIds)
                        .stream()
                        .collect(Collectors.toMap(
                                SessionDiscoveredEvidence::getEvidenceId,
                                d -> d));

        Set<UUID> myInventory = new HashSet<>(
                inventoryRepo
                        .findBySessionIdAndPlayerIdOrderByAddedAtAsc(sessionId, playerId)
                        .stream()
                        .map(PlayerInventoryItem::getEvidenceId)
                        .toList());

        Set<UUID> discovererIds = discoveredByEvidence.values().stream()
                .map(SessionDiscoveredEvidence::getDiscoveredBy)
                .collect(Collectors.toSet());
        Map<UUID, String> discovererNames = discovererIds.isEmpty()
                ? Map.of()
                : playerRepo.findAllById(discovererIds).stream()
                .collect(Collectors.toMap(SessionPlayer::getId, SessionPlayer::getDisplayName));

        List<ObjectInspectResponse.InspectEvidenceItem> items = new ArrayList<>();
        /* Список улик, найденных ИМЕННО СЕЙЧАС — для публикации событий. */
        List<UUID> justDiscovered = new ArrayList<>();

        for (Evidence e : evidences) {
            SessionDiscoveredEvidence disc = discoveredByEvidence.get(e.getId());
            boolean isNew = disc == null;

            UUID discoveredById;
            String discoveredByName;
            java.time.Instant discoveredAt;

            if (isNew) {
                disc = new SessionDiscoveredEvidence();
                disc.setSessionId(sessionId);
                disc.setEvidenceId(e.getId());
                disc.setDiscoveredBy(playerId);
                disc = discoveredRepo.save(disc);

                /* В личный Портфель кладём только первый раз. */
                if (!myInventory.contains(e.getId())) {
                    PlayerInventoryItem item = new PlayerInventoryItem();
                    item.setSessionId(sessionId);
                    item.setPlayerId(playerId);
                    item.setEvidenceId(e.getId());
                    inventoryRepo.save(item);
                    myInventory.add(e.getId());
                }

                /* WebSocket-уведомление команде. */
                eventPublisher.evidenceTaken(
                        sessionId, e.getId(), e.getTitle(), player.getDisplayName());

                justDiscovered.add(e.getId());

                discoveredById = playerId;
                discoveredByName = null;
                discoveredAt = disc.getDiscoveredAt();

            } else {
                discoveredById = disc.getDiscoveredBy();
                boolean mine = discoveredById.equals(playerId);

                if (mine && !myInventory.contains(e.getId())) {
                    /* Подстраховка: улика моя, но не в Портфеле — добавим. */
                    PlayerInventoryItem item = new PlayerInventoryItem();
                    item.setSessionId(sessionId);
                    item.setPlayerId(playerId);
                    item.setEvidenceId(e.getId());
                    inventoryRepo.save(item);
                    myInventory.add(e.getId());
                }
                discoveredByName = mine ? null : discovererNames.get(discoveredById);
                discoveredAt = disc.getDiscoveredAt();
            }

            items.add(new ObjectInspectResponse.InspectEvidenceItem(
                    e.getId(),
                    e.getTitle(),
                    e.getDescription(),
                    e.getContentText(),
                    e.getEvidenceType().name(),
                    e.getImportance().name(),
                    e.getMediaId(),
                    discoveredById,
                    discoveredByName,
                    discoveredAt,
                    myInventory.contains(e.getId())
            ));
        }

        /* Публикуем события ДО коммита, но обработаются они ПОСЛЕ него. */
        for (UUID evidenceId : justDiscovered) {
            springEvents.publishEvent(new EngineActionEvent(
                    sessionId, playerId, ConditionType.EVIDENCE_DISCOVERED, evidenceId));
        }
        springEvents.publishEvent(new EngineActionEvent(
                sessionId, playerId, ConditionType.OBJECT_INTERACTED, objectId));

        return new ObjectInspectResponse(
                object.getId(),
                object.getName(),
                object.getDescription(),
                object.getObjectType().name(),
                object.getState().name(),
                object.getMediaId(),
                items
        );
    }
}