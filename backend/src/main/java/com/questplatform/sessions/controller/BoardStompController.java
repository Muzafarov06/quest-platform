package com.questplatform.sessions.controller;

import com.questplatform.sessions.dto.BoardNoteTypingRequest;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.sessions.repository.SessionPlayerRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.UUID;

/**
 * STOMP endpoints для транзитных событий доски.
 * Не сохраняют в БД — только рассылают участникам.
 *
 * <p>Клиент отправляет на {@code /app/sessions/{sessionId}/board/note/typing}.</p>
 */
@Controller
public class BoardStompController {

    private final SessionPlayerRepository playerRepository;
    private final SessionEventPublisher publisher;

    public BoardStompController(SessionPlayerRepository playerRepository,
                                SessionEventPublisher publisher) {
        this.playerRepository = playerRepository;
        this.publisher = publisher;
    }

    @MessageMapping("/sessions/{sessionId}/board/note/typing")
    public void noteTyping(@DestinationVariable UUID sessionId,
                           @Payload BoardNoteTypingRequest request) {
        if (request == null || request.userId() == null) return;

        SessionPlayer player = playerRepository
                .findBySessionIdAndUserId(sessionId, request.userId())
                .orElse(null);
        if (player == null) return;

        publisher.publishBoardNoteTyping(
                sessionId,
                request.text() == null ? "" : request.text(),
                player.getDisplayName()
        );
    }
}