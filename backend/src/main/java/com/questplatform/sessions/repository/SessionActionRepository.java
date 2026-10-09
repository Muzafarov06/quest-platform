package com.questplatform.sessions.repository;

import com.questplatform.engine.domain.ConditionType;
import com.questplatform.sessions.entity.SessionAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionActionRepository extends JpaRepository<SessionAction, UUID> {

    List<SessionAction> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);

    boolean existsBySessionIdAndActionTypeAndTargetId(UUID sessionId,
                                                      ConditionType actionType,
                                                      UUID targetId);
}