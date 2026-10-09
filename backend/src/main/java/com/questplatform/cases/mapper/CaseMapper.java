package com.questplatform.cases.mapper;

import com.questplatform.cases.dto.CaseResponse;
import com.questplatform.cases.entity.Case;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Маппер Case → CaseResponse.
 */
@Component
public class CaseMapper {

    public CaseResponse toResponse(Case c) {
        if (c == null) {
            return null;
        }
        return new CaseResponse(
                c.getId(),
                c.getCode(),
                c.getTitle(),
                c.getDescription(),
                c.getGenre(),
                c.getAgeLimit(),
                c.getMinPlayers(),
                c.getMaxPlayers(),
                c.getDurationMinutes(),
                c.getPriceCents(),
                c.getCoverMediaId(),
                c.getMapMediaId(),
                c.getEntryLocationId(),
                c.getMapWidth(),
                c.getMapHeight(),
                c.getStatus(),
                c.getCreatedBy(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    public List<CaseResponse> toResponseList(List<Case> cases) {
        return cases.stream()
                .map(this::toResponse)
                .toList();
    }
}