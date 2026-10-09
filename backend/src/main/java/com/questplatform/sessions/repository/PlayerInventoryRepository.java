package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.PlayerInventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlayerInventoryRepository extends JpaRepository<PlayerInventoryItem, UUID> {
    List<PlayerInventoryItem> findBySessionIdAndPlayerIdOrderByAddedAtAsc(UUID sessionId, UUID playerId);
    boolean existsBySessionIdAndPlayerIdAndEvidenceId(UUID sessionId, UUID playerId, UUID evidenceId);
}