package com.questplatform.engine.service;

import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.dto.CreateFinalQuestionRequest;
import com.questplatform.engine.dto.UpdateFinalQuestionRequest;
import com.questplatform.engine.entity.FinalQuestion;
import com.questplatform.engine.repository.FinalQuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FinalQuestionService {

    private final FinalQuestionRepository repo;
    private final CaseRepository caseRepository;

    public FinalQuestionService(FinalQuestionRepository repo, CaseRepository caseRepository) {
        this.repo = repo;
        this.caseRepository = caseRepository;
    }

    @Transactional(readOnly = true)
    public FinalQuestion getByCaseId(UUID caseId) {
        return repo.findByCaseId(caseId).orElse(null);
    }

    @Transactional(readOnly = true)
    public FinalQuestion getById(UUID id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Финал не найден: " + id));
    }

    @Transactional
    public FinalQuestion createOrUpdate(UUID caseId, CreateFinalQuestionRequest req) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        validateCorrectOption(req.correctOptionId(), req.options().stream()
                .map(CreateFinalQuestionRequest.OptionRequest::id).toList());

        FinalQuestion q = repo.findByCaseId(caseId).orElseGet(FinalQuestion::new);
        q.setCaseId(caseId);
        applyRequest(q, req.questionText(), req.options(), req.correctOptionId(),
                req.explanationText(), req.revealEvidenceIds());
        return repo.save(q);
    }

    @Transactional
    public FinalQuestion update(UUID id, UpdateFinalQuestionRequest req) {
        FinalQuestion q = getById(id);
        validateCorrectOption(req.correctOptionId(), req.options().stream()
                .map(CreateFinalQuestionRequest.OptionRequest::id).toList());
        applyRequest(q, req.questionText(), req.options(), req.correctOptionId(),
                req.explanationText(), req.revealEvidenceIds());
        return repo.save(q);
    }

    @Transactional
    public void delete(UUID id) {
        repo.delete(getById(id));
    }

    private void applyRequest(FinalQuestion q,
                              String questionText,
                              List<CreateFinalQuestionRequest.OptionRequest> options,
                              String correctOptionId,
                              String explanation,
                              List<String> revealIds) {
        q.setQuestionText(questionText);
        q.setCorrectOptionId(correctOptionId);
        q.setExplanationText(explanation);
        q.setOptions(options.stream()
                .map(o -> new FinalQuestion.OptionData(o.id(), o.text()))
                .toList());
        q.setRevealEvidenceIds(revealIds != null ? new ArrayList<>(revealIds) : new ArrayList<>());
    }

    private void validateCorrectOption(String correctOptionId, List<String> optionIds) {
        if (correctOptionId != null && !optionIds.contains(correctOptionId)) {
            throw new BusinessException(
                    "correctOptionId не соответствует ни одному из вариантов",
                    HttpStatus.BAD_REQUEST);
        }
    }
}