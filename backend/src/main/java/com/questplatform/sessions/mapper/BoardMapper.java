package com.questplatform.sessions.mapper;

import com.questplatform.sessions.dto.BoardConnectionResponse;
import com.questplatform.sessions.dto.BoardItemResponse;
import com.questplatform.sessions.entity.BoardConnection;
import com.questplatform.sessions.entity.BoardItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class BoardMapper {

    /**
     * Маппинг одиночной карточки.
     */
    public BoardItemResponse toItemResponse(BoardItem i, String createdByName) {
        if (i == null) return null;
        return new BoardItemResponse(
                i.getId(),
                i.getSessionId(),
                i.getCreatedBy(),
                createdByName,
                i.getItemType(),
                i.getTitle(),
                i.getContent(),
                i.getEvidenceId(),
                i.getPosX(),
                i.getPosY(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }

    /**
     * Маппинг списка с batch-загрузкой имён. Один SELECT на всех авторов.
     */
    public List<BoardItemResponse> toItemResponseList(List<BoardItem> items, Map<UUID, String> playerNames) {
        return items.stream()
                .map(i -> toItemResponse(i, playerNames.get(i.getCreatedBy())))
                .toList();
    }

    public BoardConnectionResponse toConnectionResponse(BoardConnection c) {
        if (c == null) return null;
        return new BoardConnectionResponse(
                c.getId(),
                c.getSessionId(),
                c.getFromItemId(),
                c.getToItemId(),
                c.getLabel(),
                c.getCreatedAt()
        );
    }

    public List<BoardConnectionResponse> toConnectionResponseList(List<BoardConnection> connections) {
        return connections.stream().map(this::toConnectionResponse).toList();
    }
}