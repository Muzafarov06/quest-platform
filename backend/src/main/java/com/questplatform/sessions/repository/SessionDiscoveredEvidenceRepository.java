package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.SessionDiscoveredEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface SessionDiscoveredEvidenceRepository
        extends JpaRepository<SessionDiscoveredEvidence, UUID> {

    List<SessionDiscoveredEvidence> findBySessionIdOrderByDiscoveredAtAsc(UUID sessionId);

    boolean existsBySessionIdAndEvidenceId(UUID sessionId, UUID evidenceId);

    List<SessionDiscoveredEvidence> findBySessionIdAndEvidenceIdIn(
            UUID sessionId,
            Collection<UUID> evidenceIds
    );
}