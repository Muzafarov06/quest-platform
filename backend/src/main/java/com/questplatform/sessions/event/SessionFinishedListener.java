package com.questplatform.sessions.event;

import com.questplatform.sessions.realtime.SessionEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Слушатель {@link SessionFinishedEvent}.
 *
 * <p>Публикует WebSocket-событие {@code SESSION_FINISHED} только ПОСЛЕ
 * коммита транзакции. Иначе на фронте navigate на /result сработает
 * раньше, чем запись ответа попадёт в БД, и GET /result вернёт 404.</p>
 */
@Component
public class SessionFinishedListener {

    private final SessionEventPublisher publisher;

    public SessionFinishedListener(SessionEventPublisher publisher) {
        this.publisher = publisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSessionFinished(SessionFinishedEvent event) {
        publisher.sessionFinished(event.sessionId());
    }
}