package com.questplatform.sessions.repository;

import com.questplatform.sessions.domain.SessionStatus;
import com.questplatform.sessions.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {

    Optional<GameSession> findByRoomCode(String roomCode);

    List<GameSession> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);

    /** Все сессии кейса с заданным статусом. */
    List<GameSession> findByCaseIdAndStatus(UUID caseId, SessionStatus status);

    /** Все сессии кейса (для проверки перед удалением кейса). */
    List<GameSession> findByCaseIdOrderByCreatedAtDesc(UUID caseId);

    boolean existsByRoomCode(String roomCode);
}