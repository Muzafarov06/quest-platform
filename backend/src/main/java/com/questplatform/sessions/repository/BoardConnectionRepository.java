package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.BoardConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardConnectionRepository extends JpaRepository<BoardConnection, UUID> {
    List<BoardConnection> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}