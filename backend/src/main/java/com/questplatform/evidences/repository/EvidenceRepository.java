package com.questplatform.evidences.repository;

import com.questplatform.evidences.domain.EvidenceImportance;
import com.questplatform.evidences.domain.EvidenceType;
import com.questplatform.evidences.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, UUID> {

    /** Все улики кейса (для админки и общей картины). */
    List<Evidence> findByCaseIdOrderBySortOrderAscTitleAsc(UUID caseId);

    /** Улики, привязанные к конкретному объекту. */
    List<Evidence> findByObjectIdOrderBySortOrderAscTitleAsc(UUID objectId);

    /** Улики, привязанные к конкретной локации. */
    List<Evidence> findByLocationIdOrderBySortOrderAscTitleAsc(UUID locationId);

    /** Улики кейса по типу. */
    List<Evidence> findByCaseIdAndEvidenceType(UUID caseId, EvidenceType evidenceType);

    /** Улики кейса по важности (например, все KEY для финала). */
    List<Evidence> findByCaseIdAndImportance(UUID caseId, EvidenceImportance importance);
}