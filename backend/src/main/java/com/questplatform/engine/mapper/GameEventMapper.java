package com.questplatform.engine.mapper;

import com.questplatform.engine.dto.GameEventResponse;
import com.questplatform.engine.entity.GameEvent;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GameEventMapper {

    public GameEventResponse toResponse(GameEvent e) {
        if (e == null) return null;
        return new GameEventResponse(
                e.getId(),
                e.getCaseId(),
                e.getConditionId(),
                e.getEventType(),
                e.getTargetId(),
                e.getMessage(),
                e.isOnce(),
                e.getSortOrder()
        );
    }

    public List<GameEventResponse> toResponseList(List<GameEvent> events) {
        return events.stream().map(this::toResponse).toList();
    }
}