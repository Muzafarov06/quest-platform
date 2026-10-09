package com.questplatform.engine.service;

import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.dto.CharacterResponse;
import com.questplatform.engine.entity.CharacterDialog;
import com.questplatform.engine.entity.GameCharacter;
import com.questplatform.engine.mapper.CharacterMapper;
import com.questplatform.engine.repository.CharacterDialogRepository;
import com.questplatform.engine.repository.CharacterRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionDiscoveredEvidenceRepository;
import com.questplatform.sessions.repository.SessionUnlockedLocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CharacterService {

    private final CharacterRepository characterRepo;
    private final CharacterDialogRepository dialogRepo;
    private final LocationRepository locationRepo;
    private final CaseRepository caseRepo;
    private final GameSessionRepository sessionRepo;
    private final SessionUnlockedLocationRepository unlockedRepo;
    private final SessionDiscoveredEvidenceRepository discoveredRepo;
    private final CharacterMapper mapper;

    public CharacterService(CharacterRepository characterRepo,
                            CharacterDialogRepository dialogRepo,
                            LocationRepository locationRepo,
                            CaseRepository caseRepo,
                            GameSessionRepository sessionRepo,
                            SessionUnlockedLocationRepository unlockedRepo,
                            SessionDiscoveredEvidenceRepository discoveredRepo,
                            CharacterMapper mapper) {
        this.characterRepo = characterRepo;
        this.dialogRepo = dialogRepo;
        this.locationRepo = locationRepo;
        this.caseRepo = caseRepo;
        this.sessionRepo = sessionRepo;
        this.unlockedRepo = unlockedRepo;
        this.discoveredRepo = discoveredRepo;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> listByLocation(UUID locationId) {
        if (!locationRepo.existsById(locationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + locationId);
        }
        List<GameCharacter> chars = characterRepo.findByLocationIdOrderBySortOrderAscNameAsc(locationId);
        return chars.stream()
                .map(c -> mapper.toPlayerResponse(c, publicDialogs(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> listByCase(UUID caseId) {
        if (!caseRepo.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        List<GameCharacter> chars = characterRepo.findByCaseIdOrderBySortOrderAscNameAsc(caseId);
        return chars.stream()
                .map(c -> mapper.toPlayerResponse(c, publicDialogs(c.getId())))
                .toList();
    }

    /**
     * Персонажи, доступные команде в этой сессии — для «Вызова на допрос».
     *
     * <p>Фильтруем по правилам unlock_mode:</p>
     * <ul>
     *   <li>AUTO — если есть location_id, открыт вместе с локацией;
     *       если нет — доступен сразу;</li>
     *   <li>ALWAYS — всегда;</li>
     *   <li>LOCATION_OPENED — открыта конкретная локация в сессии;</li>
     *   <li>EVIDENCE_FOUND — найдена конкретная улика в сессии.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public List<CharacterResponse> listAvailableForSession(UUID sessionId) {
        GameSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена: " + sessionId));

        Set<UUID> unlockedLocations = unlockedRepo
                .findBySessionIdOrderByUnlockedAtAsc(sessionId).stream()
                .map(u -> u.getLocationId())
                .collect(Collectors.toSet());

        Set<UUID> discoveredEvidences = discoveredRepo
                .findBySessionIdOrderByDiscoveredAtAsc(sessionId).stream()
                .map(d -> d.getEvidenceId())
                .collect(Collectors.toSet());

        List<GameCharacter> all = characterRepo
                .findByCaseIdOrderBySortOrderAscNameAsc(session.getCaseId());

        return all.stream()
                .filter(c -> isAvailable(c, unlockedLocations, discoveredEvidences))
                .map(c -> mapper.toPlayerResponse(c, publicDialogs(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CharacterResponse getById(UUID id) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        return mapper.toPlayerResponse(c, publicDialogs(id));
    }

    private boolean isAvailable(GameCharacter c,
                                Set<UUID> unlocked,
                                Set<UUID> discovered) {
        String mode = c.getUnlockMode() == null ? "AUTO" : c.getUnlockMode();
        return switch (mode) {
            case "ALWAYS" -> true;
            case "AUTO" -> c.getLocationId() == null || unlocked.contains(c.getLocationId());
            case "LOCATION_OPENED" ->
                    c.getUnlockTargetId() != null && unlocked.contains(c.getUnlockTargetId());
            case "EVIDENCE_FOUND" ->
                    c.getUnlockTargetId() != null && discovered.contains(c.getUnlockTargetId());
            default -> false;
        };
    }

    private List<CharacterDialog> publicDialogs(UUID characterId) {
        return dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(characterId).stream()
                .filter(d -> d.getRequiresEvidenceId() == null)
                .toList();
    }
}