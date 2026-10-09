package com.questplatform.cases.repository;

import com.questplatform.cases.domain.CaseStatus;
import com.questplatform.cases.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaseRepository extends JpaRepository<Case, UUID> {

    Optional<Case> findByCode(String code);

    List<Case> findByStatus(CaseStatus status);

    List<Case> findByCreatedBy(UUID createdBy);

    boolean existsByCode(String code);

    /**
     * Все кейсы, включая DRAFT/TESTING/ARCHIVED — для админки.
     * Свежие сверху.
     */
    List<Case> findAllByOrderByCreatedAtDesc();
}