package com.questplatform.sessions.controller;

import com.questplatform.engine.dto.FinalAnswerResultResponse;
import com.questplatform.engine.dto.FinalQuestionResponse;
import com.questplatform.engine.dto.SubmitFinalAnswerRequest;
import com.questplatform.engine.entity.FinalQuestion;
import com.questplatform.engine.mapper.FinalQuestionMapper;
import com.questplatform.engine.repository.FinalQuestionRepository;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.service.FinalAnswerService;
import com.questplatform.sessions.service.SessionService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}/final")
public class FinalAnswerController {

    private final FinalAnswerService finalAnswerService;
    private final SessionService sessionService;
    private final FinalQuestionRepository questionRepo;
    private final FinalQuestionMapper mapper;

    public FinalAnswerController(FinalAnswerService finalAnswerService,
                                 SessionService sessionService,
                                 FinalQuestionRepository questionRepo,
                                 FinalQuestionMapper mapper) {
        this.finalAnswerService = finalAnswerService;
        this.sessionService = sessionService;
        this.questionRepo = questionRepo;
        this.mapper = mapper;
    }

    /** Получить финальный вопрос (для игроков — без правильного ответа). */
    @GetMapping("/question")
    public ResponseEntity<FinalQuestionResponse> getQuestion(@PathVariable UUID sessionId) {
        GameSession session = sessionService.getById(sessionId);
        FinalQuestion q = questionRepo.findByCaseId(session.getCaseId()).orElse(null);
        if (q == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(mapper.toPlayerResponse(q));
    }

    /**
     * Владелец объявляет о начале финала.
     * Все в сессии получают WS-событие {@code FINAL_ANSWER_STARTED}.
     */
    @PostMapping("/start")
    public ResponseEntity<Void> start(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal User user
    ) {
        sessionService.notifyFinalAnswerStarted(sessionId, user);
        return ResponseEntity.noContent().build();
    }

    /** Отправить финальный ответ. */
    @PostMapping("/submit")
    public ResponseEntity<FinalAnswerResultResponse> submit(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SubmitFinalAnswerRequest request,
            @AuthenticationPrincipal User user
    ) {
        SessionPlayer player = sessionService.getPlayerForUser(sessionId, user);
        return ResponseEntity.ok(
                finalAnswerService.submit(sessionId, player.getId(), request.selectedOptionId())
        );
    }

    /** Получить результат (для тех, кто вернулся после завершения). */
    @GetMapping("/result")
    public ResponseEntity<FinalAnswerResultResponse> result(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(finalAnswerService.getResult(sessionId));
    }
}