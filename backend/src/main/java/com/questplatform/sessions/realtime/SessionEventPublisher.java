package com.questplatform.sessions.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Рассылает события сессии всем подписчикам.
 * Топик: {@code /topic/session/{sessionId}}.
 */
@Component
public class SessionEventPublisher {

    private final SimpMessagingTemplate messaging;

    public SessionEventPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    public void playerEnteredLocation(UUID sessionId, String playerName, UUID locationId, String locationName) {
        publish(sessionId, Map.of(
                "type", "PLAYER_ENTERED_LOCATION",
                "playerName", playerName,
                "locationId", locationId.toString(),
                "locationName", locationName
        ));
    }

    public void playerUpdated(UUID sessionId, UUID playerId) {
        publish(sessionId, Map.of(
                "type", "PLAYER_UPDATED",
                "playerId", playerId.toString()
        ));
    }

    public void playerInteracted(UUID sessionId, String playerName, UUID objectId, String objectName) {
        publish(sessionId, Map.of(
                "type", "PLAYER_INTERACTED",
                "playerName", playerName,
                "objectId", objectId.toString(),
                "objectName", objectName
        ));
    }

    public void gameEventTriggered(UUID sessionId, Object eventPayload) {
        publish(sessionId, Map.of(
                "type", "GAME_EVENT",
                "event", eventPayload
        ));
    }

    public void playerLeft(UUID sessionId, String playerName) {
        publish(sessionId, Map.of(
                "type", "PLAYER_LEFT",
                "playerName", playerName
        ));
    }

    public void playerJoined(UUID sessionId, String playerName) {
        publish(sessionId, Map.of(
                "type", "PLAYER_JOINED",
                "playerName", playerName
        ));
    }

    public void publishBoardItemAdded(UUID sessionId, Object item, String playerName) {
        publish(sessionId, Map.of(
                "type", "BOARD_ITEM_ADDED",
                "item", item,
                "playerName", playerName
        ));
    }

    public void publishBoardItemRemoved(UUID sessionId, UUID itemId) {
        publish(sessionId, Map.of(
                "type", "BOARD_ITEM_REMOVED",
                "itemId", itemId.toString()
        ));
    }

    public void sessionStarted(UUID sessionId) {
        publish(sessionId, Map.of("type", "SESSION_STARTED"));
    }

    public void sessionFinished(UUID sessionId) {
        publish(sessionId, Map.of("type", "SESSION_FINISHED"));
    }

    /**
     * Сессия закрыта владельцем (или другой принудительный стоп).
     * Все игроки получают событие и должны вернуться к списку сессий.
     */
    public void sessionClosed(UUID sessionId, String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "SESSION_CLOSED");
        if (reason != null && !reason.isBlank()) {
            payload.put("reason", reason);
        }
        publish(sessionId, payload);
    }

    /**
     * Игрока исключили из сессии.
     * Приходит всем: сам исключённый ловит по playerId, остальные
     * перезагружают список игроков.
     */
    public void playerKicked(UUID sessionId, UUID playerId, String playerName) {
        publish(sessionId, Map.of(
                "type", "PLAYER_KICKED",
                "playerId", playerId.toString(),
                "playerName", playerName
        ));
    }

    public void playerMoved(UUID sessionId, UUID playerId, String playerName,
                            float x, float y, String facing, UUID locationId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "PLAYER_MOVED");
        payload.put("playerId", playerId.toString());
        payload.put("playerName", playerName);
        payload.put("x", x);
        payload.put("y", y);
        payload.put("facing", facing);
        if (locationId != null) {
            payload.put("locationId", locationId.toString());
        }
        publish(sessionId, payload);
    }

    public void locationUnlocked(UUID sessionId, UUID locationId,
                                 String locationName, String hint) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "LOCATION_UNLOCKED");
        payload.put("locationId", locationId.toString());
        payload.put("locationName", locationName);
        if (hint != null && !hint.isBlank()) {
            payload.put("hint", hint);
        }
        publish(sessionId, payload);
    }

    public void evidenceTaken(UUID sessionId, UUID evidenceId,
                              String evidenceTitle, String playerName) {
        publish(sessionId, Map.of(
                "type", "EVIDENCE_TAKEN",
                "evidenceId", evidenceId.toString(),
                "evidenceTitle", evidenceTitle,
                "playerName", playerName
        ));
    }

    /**
     * Владелец начал писать финальный ответ.
     * Все в сессии открывают модалку, но писать может только владелец.
     */
    public void finalAnswerStarted(UUID sessionId, String ownerName) {
        publish(sessionId, Map.of(
                "type", "FINAL_ANSWER_STARTED",
                "ownerName", ownerName
        ));
    }

    /** Кто-то передвинул карточку на доске. */
    public void publishBoardItemMoved(UUID sessionId, UUID itemId,
                                      float posX, float posY,
                                      String playerName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "BOARD_ITEM_MOVED");
        payload.put("itemId", itemId.toString());
        payload.put("posX", posX);
        payload.put("posY", posY);
        if (playerName != null) {
            payload.put("playerName", playerName);
        }
        publish(sessionId, payload);
    }

    /** Кто-то обновил общую заметку доски. */
    public void publishBoardNoteUpdated(UUID sessionId, String text,
                                        String updatedByPlayerName,
                                        java.time.Instant updatedAt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "BOARD_NOTE_UPDATED");
        payload.put("text", text);
        payload.put("updatedByPlayerName", updatedByPlayerName);
        payload.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);
        publish(sessionId, payload);
    }

    /** Транзитное событие: игрок печатает в общей заметке. */
    public void publishBoardNoteTyping(UUID sessionId, String text, String playerName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "BOARD_NOTE_TYPING");
        payload.put("text", text);
        payload.put("playerName", playerName);
        publish(sessionId, payload);
    }

    private void publish(UUID sessionId, Object payload) {
        messaging.convertAndSend("/topic/session/" + sessionId, payload);
    }
}