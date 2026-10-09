package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.SessionFinalAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionFinalAnswerRepository extends JpaRepository<SessionFinalAnswer, UUID> {

    Optional<SessionFinalAnswer> findBySessionIdAndQuestionId(UUID sessionId, UUID questionId);

    boolean existsBySessionIdAndQuestionId(UUID sessionId, UUID questionId);

    boolean existsBySessionId(UUID sessionId);
}