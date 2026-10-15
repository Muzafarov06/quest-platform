package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.sessions.domain.BoardItemType;
import com.questplatform.sessions.dto.BoardItemRequest;
import com.questplatform.sessions.entity.BoardConnection;
import com.questplatform.sessions.entity.BoardItem;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.event.BoardItemAddedEvent;
import com.questplatform.sessions.event.BoardItemMovedEvent;
import com.questplatform.sessions.event.BoardItemRemovedEvent;
import com.questplatform.sessions.event.BoardNoteUpdatedEvent;
import com.questplatform.sessions.repository.BoardConnectionRepository;
import com.questplatform.sessions.repository.BoardItemRepository;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionPlayerRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BoardService {

    /** Параметры авто-раскладки улик на доске. */
    private static final int GRID_COLS = 5;
    private static final float GRID_START_X = 200f;
    private static final float GRID_START_Y = 200f;
    private static final float GRID_STEP_X = 420f;
    private static final float GRID_STEP_Y = 560f;

    private final BoardItemRepository itemRepository;
    private final BoardConnectionRepository connectionRepository;
    private final GameSessionRepository sessionRepository;
    private final SessionPlayerRepository playerRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BoardService(BoardItemRepository itemRepository,
                        BoardConnectionRepository connectionRepository,
                        GameSessionRepository sessionRepository,
                        SessionPlayerRepository playerRepository,
                        ApplicationEventPublisher eventPublisher) {
        this.itemRepository = itemRepository;
        this.connectionRepository = connectionRepository;
        this.sessionRepository = sessionRepository;
        this.playerRepository = playerRepository;
        this.eventPublisher = eventPublisher;
    }

    /* ---------- Чтение ---------- */

    @Transactional(readOnly = true)
    public List<BoardItem> getItems(UUID sessionId) {
        ensureSession(sessionId);
        return itemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> getAuthorNames(UUID sessionId) {
        List<BoardItem> items = itemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        Set<UUID> authorIds = items.stream().map(BoardItem::getCreatedBy).collect(Collectors.toSet());
        if (authorIds.isEmpty()) return Map.of();

        return playerRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(SessionPlayer::getId, SessionPlayer::getDisplayName));
    }

    @Transactional(readOnly = true)
    public List<BoardConnection> getConnections(UUID sessionId) {
        ensureSession(sessionId);
        return connectionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    /* ---------- Добавление карточки ---------- */

    @Transactional
    public BoardItem addItem(UUID sessionId, UUID playerId, BoardItemRequest request) {
        ensureSession(sessionId);

        if (request.itemType() == BoardItemType.EVIDENCE && request.evidenceId() != null) {
            boolean exists = itemRepository.existsBySessionIdAndItemTypeAndEvidenceId(
                    sessionId, BoardItemType.EVIDENCE, request.evidenceId());
            if (exists) {
                throw new BusinessException("Эта улика уже на доске", HttpStatus.CONFLICT);
            }
        }

        BoardItem item = new BoardItem();
        item.setSessionId(sessionId);
        item.setCreatedBy(playerId);
        item.setItemType(request.itemType());
        item.setTitle(request.title());
        item.setContent(request.content());
        item.setEvidenceId(request.evidenceId());

        /* Авто-раскладка: если позиция не задана — считаем сами. */
        if (request.posX() != null && request.posY() != null) {
            item.setPosX(request.posX());
            item.setPosY(request.posY());
        } else {
            item.setPosX(0f);
            item.setPosY(0f);
            applyAutoLayout(item);
        }

        item = itemRepository.save(item);

        String playerName = playerRepository.findById(playerId)
                .map(SessionPlayer::getDisplayName)
                .orElse("Неизвестный");

        eventPublisher.publishEvent(new BoardItemAddedEvent(
                item.getId(),
                sessionId,
                item.getTitle(),
                item.getContent(),
                item.getItemType(),
                item.getEvidenceId(),
                item.getPosX(),
                item.getPosY(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                playerName
        ));

        return item;
    }

    /**
     * Тихая вставка улики на доску без ошибки, если она уже там.
     * Используется при осмотре объекта в сессии.
     */
    @Transactional
    public BoardItem addEvidenceIfAbsent(UUID sessionId,
                                         UUID playerId,
                                         UUID evidenceId,
                                         String title,
                                         String content) {
        ensureSession(sessionId);

        boolean exists = itemRepository.existsBySessionIdAndItemTypeAndEvidenceId(
                sessionId, BoardItemType.EVIDENCE, evidenceId);
        if (exists) {
            return null;
        }

        BoardItem item = new BoardItem();
        item.setSessionId(sessionId);
        item.setCreatedBy(playerId);
        item.setItemType(BoardItemType.EVIDENCE);
        item.setTitle(title);
        item.setContent(content);
        item.setEvidenceId(evidenceId);
        item.setPosX(0f);
        item.setPosY(0f);
        applyAutoLayout(item);
        item = itemRepository.save(item);

        String playerName = playerRepository.findById(playerId)
                .map(SessionPlayer::getDisplayName)
                .orElse("Неизвестный");

        eventPublisher.publishEvent(new BoardItemAddedEvent(
                item.getId(),
                sessionId,
                item.getTitle(),
                item.getContent(),
                item.getItemType(),
                item.getEvidenceId(),
                item.getPosX(),
                item.getPosY(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                playerName
        ));

        return item;
    }

    /**
     * Авто-раскладка: сдвигаем улику в следующую свободную ячейку сетки.
     * Учитываем только уже существующие EVIDENCE-карточки.
     */
    private void applyAutoLayout(BoardItem item) {
        long n = itemRepository.countBySessionIdAndItemType(
                item.getSessionId(), BoardItemType.EVIDENCE);

        int col = (int) (n % GRID_COLS);
        int row = (int) (n / GRID_COLS);

        item.setPosX(GRID_START_X + col * GRID_STEP_X);
        item.setPosY(GRID_START_Y + row * GRID_STEP_Y);
    }

    /* ---------- Движение карточки ---------- */

    @Transactional
    public BoardItem moveItem(UUID sessionId, UUID itemId, float posX, float posY) {
        BoardItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Карточка не найдена: " + itemId));
        if (!item.getSessionId().equals(sessionId)) {
            throw new ResourceNotFoundException("Карточка не из этой сессии");
        }

        item.setPosX(posX);
        item.setPosY(posY);
        item.setUpdatedAt(Instant.now());
        item = itemRepository.save(item);

        eventPublisher.publishEvent(new BoardItemMovedEvent(
                sessionId, itemId, posX, posY, null));
        return item;
    }

    @Transactional
    public void deleteItem(UUID sessionId, UUID itemId) {
        BoardItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Карточка не найдена: " + itemId));
        if (!item.getSessionId().equals(sessionId)) {
            throw new ResourceNotFoundException("Карточка не из этой сессии");
        }
        itemRepository.delete(item);
        eventPublisher.publishEvent(new BoardItemRemovedEvent(sessionId, itemId));
    }

    /* ---------- Общая заметка ---------- */

    @Transactional(readOnly = true)
    public String getNoteText(UUID sessionId) {
        GameSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена"));
        return s.getBoardNoteText() == null ? "" : s.getBoardNoteText();
    }

    @Transactional
    public void updateNote(UUID sessionId, UUID playerId, String text) {
        GameSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена"));

        s.setBoardNoteText(text);
        s.setBoardNoteUpdatedAt(Instant.now());
        s.setBoardNoteUpdatedBy(playerId);
        sessionRepository.save(s);

        String playerName = playerRepository.findById(playerId)
                .map(SessionPlayer::getDisplayName)
                .orElse("Неизвестный");

        eventPublisher.publishEvent(new BoardNoteUpdatedEvent(
                sessionId, text, playerName, s.getBoardNoteUpdatedAt()));
    }

    /* ---------- Helpers ---------- */

    private void ensureSession(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Сессия не найдена: " + sessionId);
        }
    }
}