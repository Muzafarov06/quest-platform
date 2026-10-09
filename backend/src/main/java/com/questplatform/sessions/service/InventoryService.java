package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.sessions.entity.PlayerInventoryItem;
import com.questplatform.sessions.entity.SessionDiscoveredEvidence;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.sessions.repository.PlayerInventoryRepository;
import com.questplatform.sessions.repository.SessionDiscoveredEvidenceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Инвентарь и обнаруженные улики.
 */
@Service
public class InventoryService {

    private final SessionDiscoveredEvidenceRepository discoveredRepository;
    private final PlayerInventoryRepository inventoryRepository;
    private final EvidenceRepository evidenceRepository;
    private final SessionEventPublisher eventPublisher;

    public InventoryService(SessionDiscoveredEvidenceRepository discoveredRepository,
                            PlayerInventoryRepository inventoryRepository,
                            EvidenceRepository evidenceRepository,
                            SessionEventPublisher eventPublisher) {
        this.discoveredRepository = discoveredRepository;
        this.inventoryRepository = inventoryRepository;
        this.evidenceRepository = evidenceRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Улика «найдена командой» — добавляем в общий список, если её ещё нет.
     * Broadcast всем.
     */
    @Transactional
    public void markDiscovered(UUID sessionId, UUID playerId, UUID evidenceId) {
        if (discoveredRepository.existsBySessionIdAndEvidenceId(sessionId, evidenceId)) {
            return;
        }
        SessionDiscoveredEvidence d = new SessionDiscoveredEvidence();
        d.setSessionId(sessionId);
        d.setEvidenceId(evidenceId);
        d.setDiscoveredBy(playerId);
        discoveredRepository.save(d);

        Evidence evidence = evidenceRepository.findById(evidenceId).orElse(null);
        if (evidence != null) {
            eventPublisher.gameEventTriggered(sessionId, evidence);
        }
    }

    /**
     * Игрок берёт улику в свою сумку.
     */
    @Transactional
    public PlayerInventoryItem takeToInventory(UUID sessionId, UUID playerId, UUID evidenceId) {
        if (!evidenceRepository.existsById(evidenceId)) {
            throw new ResourceNotFoundException("Улика не найдена: " + evidenceId);
        }
        if (inventoryRepository.existsBySessionIdAndPlayerIdAndEvidenceId(sessionId, playerId, evidenceId)) {
            throw new BusinessException("Улика уже в вашей сумке", HttpStatus.CONFLICT);
        }
        PlayerInventoryItem item = new PlayerInventoryItem();
        item.setSessionId(sessionId);
        item.setPlayerId(playerId);
        item.setEvidenceId(evidenceId);
        inventoryRepository.save(item);

        markDiscovered(sessionId, playerId, evidenceId);

        return item;
    }

    @Transactional(readOnly = true)
    public List<PlayerInventoryItem> getMyInventory(UUID sessionId, UUID playerId) {
        return inventoryRepository.findBySessionIdAndPlayerIdOrderByAddedAtAsc(sessionId, playerId);
    }

    @Transactional(readOnly = true)
    public List<SessionDiscoveredEvidence> getTeamDiscovered(UUID sessionId) {
        return discoveredRepository.findBySessionIdOrderByDiscoveredAtAsc(sessionId);
    }
}