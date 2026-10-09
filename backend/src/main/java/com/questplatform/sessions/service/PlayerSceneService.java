package com.questplatform.sessions.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.entity.CharacterDialog;
import com.questplatform.engine.entity.GameCharacter;
import com.questplatform.engine.mapper.CharacterMapper;
import com.questplatform.engine.repository.CharacterDialogRepository;
import com.questplatform.engine.repository.CharacterRepository;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.entity.LocationConnection;
import com.questplatform.locations.mapper.LocationConnectionMapper;
import com.questplatform.locations.mapper.LocationMapper;
import com.questplatform.locations.repository.LocationConnectionRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.mapper.GameObjectMapper;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.sessions.dto.PlayerSceneResponse;
import com.questplatform.sessions.entity.GameSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PlayerSceneService {

    private final LocationRepository locationRepository;
    private final LocationConnectionRepository connectionRepository;
    private final GameObjectRepository gameObjectRepository;
    private final CharacterRepository characterRepository;
    private final CharacterDialogRepository dialogRepository;
    private final LocationDiscoveryService discoveryService;
    private final LocationMapper locationMapper;
    private final LocationConnectionMapper connectionMapper;
    private final GameObjectMapper gameObjectMapper;
    private final CharacterMapper characterMapper;
    private final SessionService sessionService;

    public PlayerSceneService(LocationRepository locationRepository,
                              LocationConnectionRepository connectionRepository,
                              GameObjectRepository gameObjectRepository,
                              CharacterRepository characterRepository,
                              CharacterDialogRepository dialogRepository,
                              LocationDiscoveryService discoveryService,
                              LocationMapper locationMapper,
                              LocationConnectionMapper connectionMapper,
                              GameObjectMapper gameObjectMapper,
                              CharacterMapper characterMapper,
                              SessionService sessionService) {
        this.locationRepository = locationRepository;
        this.connectionRepository = connectionRepository;
        this.gameObjectRepository = gameObjectRepository;
        this.characterRepository = characterRepository;
        this.dialogRepository = dialogRepository;
        this.discoveryService = discoveryService;
        this.locationMapper = locationMapper;
        this.connectionMapper = connectionMapper;
        this.gameObjectMapper = gameObjectMapper;
        this.characterMapper = characterMapper;
        this.sessionService = sessionService;
    }

    @Transactional(readOnly = true)
    public PlayerSceneResponse getScene(UUID sessionId, UUID locationId) {
        GameSession session = sessionService.getById(sessionId);

        Set<UUID> unlocked = discoveryService.getUnlockedLocationIds(sessionId);
        if (!unlocked.contains(locationId)) {
            throw new BusinessException(
                    "Локация ещё не открыта в этой сессии",
                    HttpStatus.FORBIDDEN);
        }

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Локация не найдена: " + locationId));
        if (!location.getCaseId().equals(session.getCaseId())) {
            throw new BusinessException(
                    "Локация принадлежит другому делу",
                    HttpStatus.BAD_REQUEST);
        }

        List<GameObject> objects =
                gameObjectRepository.findByLocationIdOrderBySortOrderAscNameAsc(locationId);

        List<GameCharacter> chars =
                characterRepository.findByLocationIdOrderBySortOrderAscNameAsc(locationId);

        List<LocationConnection> connections =
                connectionRepository.findByFromLocationIdOrderBySortOrderAscIdAsc(locationId)
                        .stream()
                        .filter(c -> unlocked.contains(c.getToLocationId()))
                        .toList();

        List<Location> subLocations =
                locationRepository.findByParentIdOrderBySortOrderAscNameAsc(locationId)
                        .stream()
                        .filter(l -> unlocked.contains(l.getId()))
                        .toList();

        return new PlayerSceneResponse(
                locationMapper.toResponse(location),
                gameObjectMapper.toResponseList(objects),
                chars.stream()
                        .map(c -> characterMapper.toPlayerResponse(c, publicDialogs(c.getId())))
                        .toList(),
                connectionMapper.toResponseList(connections),
                locationMapper.toResponseList(subLocations)
        );
    }

    private List<CharacterDialog> publicDialogs(UUID characterId) {
        return dialogRepository.findByCharacterIdOrderBySortOrderAscIdAsc(characterId)
                .stream()
                .filter(d -> d.getRequiresEvidenceId() == null)
                .toList();
    }
}