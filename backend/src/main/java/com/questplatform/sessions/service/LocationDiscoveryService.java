package com.questplatform.sessions.service;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionUnlockedLocation;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionUnlockedLocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Отвечает за постепенное открытие локаций в сессии.
 *
 * <p>Логика:
 * <ul>
 *   <li>при старте сессии — открываются все ALWAYS-локации кейса;</li>
 *   <li>при находке улики / посещении / диалоге — открываются
 *       локации с соответствующим discoveryMode и targetId;</li>
 *   <li>открытие идемпотентно: если уже открыта — ничего не делаем;</li>
 *   <li>при открытии рассылается WebSocket-событие
 *       {@code LOCATION_UNLOCKED} с названием и подсказкой.</li>
 * </ul>
 * </p>
 */
@Service
public class LocationDiscoveryService {

    private final LocationRepository locationRepository;
    private final SessionUnlockedLocationRepository unlockedRepository;
    private final GameSessionRepository sessionRepository;
    private final SessionEventPublisher eventPublisher;

    public LocationDiscoveryService(LocationRepository locationRepository,
                                    SessionUnlockedLocationRepository unlockedRepository,
                                    GameSessionRepository sessionRepository,
                                    SessionEventPublisher eventPublisher) {
        this.locationRepository = locationRepository;
        this.unlockedRepository = unlockedRepository;
        this.sessionRepository = sessionRepository;
        this.eventPublisher = eventPublisher;
    }

    /** Открыть локации, доступные сразу при старте сессии (ALWAYS). */
    @Transactional
    public void initAlwaysLocations(UUID sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        List<Location> always =
                locationRepository.findByCaseIdAndDiscoveryMode(
                        session.getCaseId(), DiscoveryMode.ALWAYS);

        for (Location l : always) {
            unlock(sessionId, l, null);
        }
    }

    /** Открыть локации по конкретному триггеру (улика / локация / диалог). */
    @Transactional
    public void onTrigger(UUID sessionId, DiscoveryMode mode,
                          UUID targetId, UUID playerId) {
        if (mode == DiscoveryMode.ALWAYS || mode == DiscoveryMode.ON_MANUAL) {
            return;
        }
        if (targetId == null) return;

        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        List<Location> toOpen =
                locationRepository.findByCaseIdAndDiscoveryModeAndDiscoveryTargetId(
                        session.getCaseId(), mode, targetId);

        for (Location l : toOpen) {
            unlock(sessionId, l, playerId);
        }
    }

    /** Список id всех уже открытых локаций в сессии. */
    @Transactional(readOnly = true)
    public Set<UUID> getUnlockedLocationIds(UUID sessionId) {
        Set<UUID> ids = new HashSet<>();
        for (SessionUnlockedLocation u : unlockedRepository.findBySessionIdOrderByUnlockedAtAsc(sessionId)) {
            ids.add(u.getLocationId());
        }
        return ids;
    }

    /**
     * Открыть конкретную локацию. Идемпотентно.
     * При новом открытии рассылает WebSocket-событие.
     */
    @Transactional
    public void unlock(UUID sessionId, Location location, UUID unlockedBy) {
        if (unlockedRepository.existsBySessionIdAndLocationId(sessionId, location.getId())) {
            return;
        }

        SessionUnlockedLocation u = new SessionUnlockedLocation();
        u.setSessionId(sessionId);
        u.setLocationId(location.getId());
        u.setUnlockedBy(unlockedBy);
        unlockedRepository.save(u);

        eventPublisher.locationUnlocked(
                sessionId,
                location.getId(),
                location.getName(),
                location.getDiscoveryHint());
    }
}