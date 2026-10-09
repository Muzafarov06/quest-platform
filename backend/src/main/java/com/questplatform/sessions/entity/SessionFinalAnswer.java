package com.questplatform.sessions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "session_final_answers")
@Getter
@Setter
@NoArgsConstructor
public class SessionFinalAnswer {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "question_id", nullable = false, updatable = false)
    private UUID questionId;

    /** Свободный текстовый ответ команды. Может быть длинным — колонка TEXT. */
    @Column(name = "selected_option_id", nullable = false, columnDefinition = "TEXT")
    private String selectedOptionId;

    @Column(name = "submitted_by", nullable = false, updatable = false)
    private UUID submittedBy;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @PrePersist
    void onCreate() {
        if (submittedAt == null) submittedAt = Instant.now();
    }
}