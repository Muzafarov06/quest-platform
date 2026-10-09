package com.questplatform.sessions.repository;

import com.questplatform.sessions.entity.BoardItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardItemRepository extends JpaRepository<BoardItem, UUID> {
    List<BoardItem> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}