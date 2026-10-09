package com.questplatform.engine.repository;

import com.questplatform.engine.entity.FinalQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinalQuestionRepository extends JpaRepository<FinalQuestion, UUID> {

    Optional<FinalQuestion> findByCaseId(UUID caseId);

    boolean existsByCaseId(UUID caseId);
}