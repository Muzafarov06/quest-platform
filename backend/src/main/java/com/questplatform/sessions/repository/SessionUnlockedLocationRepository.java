package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.SessionUnlockedLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionUnlockedLocationRepository
        extends JpaRepository<SessionUnlockedLocation, UUID> {

    List<SessionUnlockedLocation> findBySessionIdOrderByUnlockedAtAsc(UUID sessionId);

    boolean existsBySessionIdAndLocationId(UUID sessionId, UUID locationId);
}