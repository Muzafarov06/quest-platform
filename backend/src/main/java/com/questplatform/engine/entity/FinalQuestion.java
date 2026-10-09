package com.questplatform.engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "final_questions")
@Getter
@Setter
@NoArgsConstructor
public class FinalQuestion {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    /**
     * Список вариантов ответа. Хранится как JSONB.
     * Каждый элемент — {id, text}.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", nullable = false, columnDefinition = "jsonb")
    private List<OptionData> options = new ArrayList<>();

    @Column(name = "correct_option_id", nullable = false, length = 100)
    private String correctOptionId;

    @Column(name = "explanation_text", columnDefinition = "TEXT")
    private String explanationText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reveal_evidence_ids", nullable = false, columnDefinition = "jsonb")
    private List<String> revealEvidenceIds = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (options == null) options = new ArrayList<>();
        if (revealEvidenceIds == null) revealEvidenceIds = new ArrayList<>();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /** Один вариант ответа. */
    public static class OptionData {
        private String id;
        private String text;

        public OptionData() {}
        public OptionData(String id, String text) {
            this.id = id;
            this.text = text;
        }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }
}