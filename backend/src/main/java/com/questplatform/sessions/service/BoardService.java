package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.sessions.domain.BoardItemType;
import com.questplatform.sessions.dto.BoardItemRequest;
import com.questplatform.sessions.entity.BoardConnection;
import com.questplatform.sessions.entity.BoardItem;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.event.BoardItemAddedEvent;
import com.questplatform.sessions.event.BoardItemRemovedEvent;
import com.questplatform.sessions.repository.BoardConnectionRepository;
import com.questplatform.sessions.repository.BoardItemRepository;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionPlayerRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BoardService {

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

    @Transactional
    public BoardItem addItem(UUID sessionId, UUID playerId, BoardItemRequest request) {
        ensureSession(sessionId);

        if (request.itemType() == BoardItemType.EVIDENCE && request.evidenceId() != null) {
            boolean exists = itemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                    .anyMatch(i -> i.getItemType() == BoardItemType.EVIDENCE
                            && request.evidenceId().equals(i.getEvidenceId()));
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
        item.setPosX(request.posX() != null ? request.posX() : 0f);
        item.setPosY(request.posY() != null ? request.posY() : 0f);
        item = itemRepository.save(item);

        String playerName = playerRepository.findById(playerId)
                .map(SessionPlayer::getDisplayName)
                .orElse("Неизвестный");

        // Публикуем Spring-событие. Слушатель сработает ТОЛЬКО после коммита.
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

    private void ensureSession(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Сессия не найдена: " + sessionId);
        }
    }
}