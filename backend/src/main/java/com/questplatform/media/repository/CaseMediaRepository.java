package com.questplatform.media.repository;

import com.questplatform.media.entity.CaseMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaseMediaRepository extends JpaRepository<CaseMedia, UUID> {
    List<CaseMedia> findByCaseIdOrderByCreatedAtAsc(UUID caseId);
    boolean existsByS3Key(String s3Key);
}