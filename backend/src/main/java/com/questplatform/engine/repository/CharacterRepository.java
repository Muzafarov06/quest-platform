package com.questplatform.engine.repository;

import com.questplatform.engine.entity.GameCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CharacterRepository extends JpaRepository<GameCharacter, UUID> {

    List<GameCharacter> findByCaseIdOrderBySortOrderAscNameAsc(UUID caseId);

    List<GameCharacter> findByLocationIdOrderBySortOrderAscNameAsc(UUID locationId);

    boolean existsByCaseId(UUID caseId);
}