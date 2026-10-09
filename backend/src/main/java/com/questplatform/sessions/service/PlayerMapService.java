package com.questplatform.sessions.service;

import com.questplatform.cases.entity.Case;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.dto.PlayerMapResponse;
import com.questplatform.sessions.entity.GameSession;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PlayerMapService {

    private final CaseRepository caseRepository;
    private final LocationRepository locationRepository;
    private final LocationDiscoveryService discoveryService;
    private final SessionService sessionService;

    public PlayerMapService(CaseRepository caseRepository,
                            LocationRepository locationRepository,
                            LocationDiscoveryService discoveryService,
                            SessionService sessionService) {
        this.caseRepository = caseRepository;
        this.locationRepository = locationRepository;
        this.discoveryService = discoveryService;
        this.sessionService = sessionService;
    }

    @Transactional(readOnly = true)
    public PlayerMapResponse getMap(UUID sessionId) {
        GameSession session = sessionService.getById(sessionId);

        Case c = caseRepository.findById(session.getCaseId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Кейс не найден: " + session.getCaseId()));

        Set<UUID> unlocked = discoveryService.getUnlockedLocationIds(sessionId);

        /* На карту дела попадают только корневые локации.
           Под-локации (parentId != null) живут внутри родителя и на карте не рисуются. */
        List<Location> all = locationRepository
                .findByCaseIdAndParentIdIsNullOrderBySortOrderAscNameAsc(c.getId());

        List<PlayerMapResponse.PlayerMapLocation> locs = all.stream()
                .map(l -> new PlayerMapResponse.PlayerMapLocation(
                        l.getId(),
                        l.getName(),
                        l.getLocationType().name(),
                        l.getMediaId(),
                        l.getPreviewMediaId(),
                        l.getMapMediaId(),
                        l.getMapX(),
                        l.getMapY(),
                        l.getSceneScale(),
                        l.getSceneRotation(),
                        unlocked.contains(l.getId()),
                        l.getId().equals(c.getEntryLocationId())
                ))
                .toList();

        return new PlayerMapResponse(
                c.getId(),
                c.getCode(),
                c.getTitle(),
                c.getMapMediaId(),
                c.getMapWidth(),
                c.getMapHeight(),
                c.getEntryLocationId(),
                locs
        );
    }
}