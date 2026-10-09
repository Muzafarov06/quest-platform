package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.SessionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionPlayerRepository extends JpaRepository<SessionPlayer, UUID> {
    List<SessionPlayer> findBySessionIdOrderByJoinedAtAsc(UUID sessionId);
    Optional<SessionPlayer> findBySessionIdAndUserId(UUID sessionId, UUID userId);
    Optional<SessionPlayer> findBySessionIdAndGuestToken(UUID sessionId, UUID guestToken);
    boolean existsBySessionIdAndAvatarKeyAndActiveTrue(UUID sessionId, String avatarKey);
}