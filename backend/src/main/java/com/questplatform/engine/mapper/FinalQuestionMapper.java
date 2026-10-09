package com.questplatform.engine.mapper;

import com.questplatform.engine.dto.FinalQuestionAdminResponse;
import com.questplatform.engine.dto.FinalQuestionResponse;
import com.questplatform.engine.entity.FinalQuestion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FinalQuestionMapper {

    public FinalQuestionResponse toPlayerResponse(FinalQuestion q) {
        if (q == null) return null;
        List<FinalQuestionResponse.Option> opts = q.getOptions().stream()
                .map(o -> new FinalQuestionResponse.Option(o.getId(), o.getText()))
                .toList();
        return new FinalQuestionResponse(q.getId(), q.getQuestionText(), opts);
    }

    public FinalQuestionAdminResponse toAdminResponse(FinalQuestion q) {
        if (q == null) return null;
        List<FinalQuestionAdminResponse.Option> opts = q.getOptions().stream()
                .map(o -> new FinalQuestionAdminResponse.Option(o.getId(), o.getText()))
                .toList();
        return new FinalQuestionAdminResponse(
                q.getId(),
                q.getCaseId(),
                q.getQuestionText(),
                opts,
                q.getCorrectOptionId(),
                q.getExplanationText(),
                q.getRevealEvidenceIds()
        );
    }
}