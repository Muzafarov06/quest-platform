package com.questplatform.figures.mapper;

import com.questplatform.figures.dto.FigureResponse;
import com.questplatform.figures.entity.Figure;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FigureMapper {

    public FigureResponse toResponse(Figure f) {
        if (f == null) return null;
        return new FigureResponse(
                f.getId(),
                f.getCode(),
                f.getLabel(),
                f.getFallbackEmoji(),
                f.getMediaId(),
                f.getSortOrder(),
                f.isActive(),
                f.getCreatedAt()
        );
    }

    public List<FigureResponse> toResponseList(List<Figure> list) {
        return list.stream().map(this::toResponse).toList();
    }
}