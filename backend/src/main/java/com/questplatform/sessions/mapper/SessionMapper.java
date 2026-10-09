package com.questplatform.sessions.mapper;

import com.questplatform.sessions.dto.SessionPlayerResponse;
import com.questplatform.sessions.dto.SessionResponse;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionPlayer;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SessionMapper {

    public SessionResponse toResponse(GameSession s) {
        if (s == null) return null;
        return new SessionResponse(
                s.getId(),
                s.getCaseId(),
                s.getOwnerUserId(),
                s.getRoomCode(),
                s.getStatus(),
                s.isTest(),
                s.getCreatedAt(),
                s.getStartedAt(),
                s.getFinishedAt()
        );
    }

    public List<SessionResponse> toResponseList(List<GameSession> sessions) {
        return sessions.stream().map(this::toResponse).toList();
    }

    public SessionPlayerResponse toPlayerResponse(SessionPlayer p) {
        if (p == null) return null;
        return new SessionPlayerResponse(
                p.getId(),
                p.getSessionId(),
                p.getUserId(),
                p.getGuestToken(),
                p.getDisplayName(),
                p.getAvatarKey(),
                p.getPosX(),
                p.getPosY(),
                p.getFacing(),
                p.getCurrentLocationId(),
                p.getJoinedAt(),
                p.getLastSeenAt(),
                p.isActive(),
                p.isReady()
        );
    }

    public List<SessionPlayerResponse> toPlayerResponseList(List<SessionPlayer> players) {
        return players.stream().map(this::toPlayerResponse).toList();
    }
}