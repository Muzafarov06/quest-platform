package com.questplatform.evidences.entity;

import com.questplatform.evidences.domain.EvidenceImportance;
import com.questplatform.evidences.domain.EvidenceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Улика внутри кейса.
 *
 * <p>Может быть привязана к объекту (клик → улика),
 * к локации (лежит в локации), или ни к чему (выдаётся событием).</p>
 */
@Entity
@Table(name = "evidences")
@Getter
@Setter
@NoArgsConstructor
public class Evidence {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "object_id")
    private UUID objectId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content_text", columnDefinition = "TEXT")
    private String contentText;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 30)
    private EvidenceType evidenceType = EvidenceType.DOCUMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "importance", nullable = false, length = 20)
    private EvidenceImportance importance = EvidenceImportance.SUPPORTING;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "media_id")
    private UUID mediaId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (evidenceType == null) evidenceType = EvidenceType.DOCUMENT;
        if (importance == null) importance = EvidenceImportance.SUPPORTING;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}