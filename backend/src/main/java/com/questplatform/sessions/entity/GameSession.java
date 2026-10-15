package com.questplatform.sessions.entity;

import com.questplatform.sessions.domain.SessionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_sessions")
@Getter
@Setter
@NoArgsConstructor
public class GameSession {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "owner_user_id", nullable = false, updatable = false)
    private UUID ownerUserId;

    @Column(name = "room_code", nullable = false, unique = true, length = 10)
    private String roomCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.LOBBY;

    @Column(name = "is_test", nullable = false)
    private boolean test = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    /** Общая заметка доски расследования. Редактируется всеми игроками. */
    @Column(name = "board_note_text", columnDefinition = "TEXT")
    private String boardNoteText;

    @Column(name = "board_note_updated_at")
    private Instant boardNoteUpdatedAt;

    @Column(name = "board_note_updated_by")
    private UUID boardNoteUpdatedBy;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = SessionStatus.LOBBY;
    }
}