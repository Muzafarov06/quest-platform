package com.questplatform.sessions.event;

import com.questplatform.sessions.realtime.SessionEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashMap;
import java.util.Map;

@Component
public class BoardEventListener {

    private final SessionEventPublisher publisher;

    public BoardEventListener(SessionEventPublisher publisher) {
        this.publisher = publisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onItemAdded(BoardItemAddedEvent event) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", event.itemId().toString());
        item.put("sessionId", event.sessionId().toString());
        item.put("title", event.title());
        item.put("content", event.content());
        item.put("itemType", event.itemType().name());
        item.put("evidenceId", event.evidenceId() != null ? event.evidenceId().toString() : null);
        item.put("posX", event.posX());
        item.put("posY", event.posY());
        item.put("createdAt", event.createdAt() != null ? event.createdAt().toString() : null);
        item.put("updatedAt", event.updatedAt() != null ? event.updatedAt().toString() : null);
        publisher.publishBoardItemAdded(event.sessionId(), item, event.playerName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onItemRemoved(BoardItemRemovedEvent event) {
        publisher.publishBoardItemRemoved(event.sessionId(), event.itemId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onItemMoved(BoardItemMovedEvent event) {
        publisher.publishBoardItemMoved(
                event.sessionId(), event.itemId(),
                event.posX(), event.posY(), event.playerName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNoteUpdated(BoardNoteUpdatedEvent event) {
        publisher.publishBoardNoteUpdated(
                event.sessionId(), event.text(),
                event.updatedByPlayerName(), event.updatedAt());
    }
}