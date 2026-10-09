package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.dto.FinalAnswerResultResponse;
import com.questplatform.engine.entity.FinalQuestion;
import com.questplatform.engine.repository.FinalQuestionRepository;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.sessions.domain.SessionStatus;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionFinalAnswer;
import com.questplatform.sessions.event.SessionFinishedEvent;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionFinalAnswerRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FinalAnswerService {

    private final SessionFinalAnswerRepository answerRepo;
    private final GameSessionRepository sessionRepo;
    private final FinalQuestionRepository questionRepo;
    private final EvidenceRepository evidenceRepo;
    private final ApplicationEventPublisher eventPublisher;

    public FinalAnswerService(SessionFinalAnswerRepository answerRepo,
                              GameSessionRepository sessionRepo,
                              FinalQuestionRepository questionRepo,
                              EvidenceRepository evidenceRepo,
                              ApplicationEventPublisher eventPublisher) {
        this.answerRepo = answerRepo;
        this.sessionRepo = sessionRepo;
        this.questionRepo = questionRepo;
        this.evidenceRepo = evidenceRepo;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public FinalAnswerResultResponse submit(UUID sessionId, UUID playerId, String freeTextAnswer) {
        GameSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена: " + sessionId));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BusinessException("Сессия не в статусе игры", HttpStatus.CONFLICT);
        }

        FinalQuestion q = questionRepo.findByCaseId(session.getCaseId())
                .orElseThrow(() -> new BusinessException(
                        "У кейса нет финального вопроса", HttpStatus.CONFLICT));

        if (answerRepo.existsBySessionIdAndQuestionId(sessionId, q.getId())) {
            throw new BusinessException("Ответ уже отправлен", HttpStatus.CONFLICT);
        }

        if (freeTextAnswer == null || freeTextAnswer.isBlank()) {
            throw new BusinessException("Пустой ответ", HttpStatus.BAD_REQUEST);
        }

        SessionFinalAnswer answer = new SessionFinalAnswer();
        answer.setSessionId(sessionId);
        answer.setQuestionId(q.getId());
        answer.setSelectedOptionId(freeTextAnswer.trim());
        answer.setSubmittedBy(playerId);
        // В свободной форме «правильно/неправильно» не оцениваем.
        answer.setCorrect(false);
        answerRepo.save(answer);

        session.setStatus(SessionStatus.FINISHED);
        session.setFinishedAt(Instant.now());
        sessionRepo.save(session);

        eventPublisher.publishEvent(new SessionFinishedEvent(sessionId));

        return buildResult(q, freeTextAnswer.trim());
    }

    @Transactional(readOnly = true)
    public FinalAnswerResultResponse getResult(UUID sessionId) {
        GameSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена"));

        FinalQuestion q = questionRepo.findByCaseId(session.getCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("У кейса нет финального вопроса"));

        SessionFinalAnswer answer = answerRepo
                .findBySessionIdAndQuestionId(sessionId, q.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ответ не найден"));

        return buildResult(q, answer.getSelectedOptionId());
    }

    private FinalAnswerResultResponse buildResult(FinalQuestion q, String freeText) {
        List<FinalAnswerResultResponse.EvidenceBrief> revealed = new ArrayList<>();
        if (q.getRevealEvidenceIds() != null && !q.getRevealEvidenceIds().isEmpty()) {
            List<UUID> ids = q.getRevealEvidenceIds().stream().map(UUID::fromString).toList();
            for (Evidence e : evidenceRepo.findAllById(ids)) {
                revealed.add(new FinalAnswerResultResponse.EvidenceBrief(
                        e.getId(), e.getTitle(), e.getContentText()));
            }
        }

        return new FinalAnswerResultResponse(
                q.getId(),
                q.getQuestionText(),
                null,               // correctOptionId — не используется
                null,               // correctOptionText
                freeText,
                freeText,           // selectedOptionText = свободный ответ
                false,              // isCorrect — всегда false в свободной форме
                q.getExplanationText(),
                revealed
        );
    }
}