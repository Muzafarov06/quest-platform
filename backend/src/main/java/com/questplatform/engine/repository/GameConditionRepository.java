package com.questplatform.engine.repository;

import com.questplatform.engine.entity.GameCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameConditionRepository extends JpaRepository<GameCondition, UUID> {
    List<GameCondition> findByCaseId(UUID caseId);
}