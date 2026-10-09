package com.questplatform.media.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "case_media")
@Getter
@Setter
@NoArgsConstructor
public class CaseMedia {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * Кейс, к которому привязано медиа.
     *
     * <p>{@code null} — глобальный контент платформы (например, PNG фигурок).
     * Ограничение снято миграцией V33: {@code case_media.case_id} стал nullable.
     * В dev это нужно для фигурок; в проде — для общих ресурсов.</p>
     */
    @Column(name = "case_id")
    private UUID caseId;

    @Column(name = "s3_key", nullable = false, unique = true, length = 500)
    private String s3Key;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "uploaded_by", nullable = false, updatable = false)
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}