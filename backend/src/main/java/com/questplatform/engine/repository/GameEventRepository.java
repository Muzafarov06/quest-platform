package com.questplatform.engine.repository;

import com.questplatform.engine.entity.GameEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameEventRepository extends JpaRepository<GameEvent, UUID> {
    List<GameEvent> findByCaseIdOrderBySortOrderAsc(UUID caseId);
    List<GameEvent> findByConditionIdOrderBySortOrderAsc(UUID conditionId);
}