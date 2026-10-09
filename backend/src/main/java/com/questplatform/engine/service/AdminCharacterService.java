package com.questplatform.engine.service;

import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.dto.CharacterAdminResponse;
import com.questplatform.engine.dto.CreateCharacterRequest;
import com.questplatform.engine.dto.CreateDialogRequest;
import com.questplatform.engine.dto.UpdateCharacterRequest;
import com.questplatform.engine.dto.UpdateDialogRequest;
import com.questplatform.engine.entity.CharacterDialog;
import com.questplatform.engine.entity.GameCharacter;
import com.questplatform.engine.mapper.CharacterMapper;
import com.questplatform.engine.repository.CharacterDialogRepository;
import com.questplatform.engine.repository.CharacterRepository;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.repository.LocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminCharacterService {

    private final CharacterRepository characterRepo;
    private final CharacterDialogRepository dialogRepo;
    private final CaseRepository caseRepo;
    private final LocationRepository locationRepo;
    private final CharacterMapper mapper;

    public AdminCharacterService(CharacterRepository characterRepo,
                                 CharacterDialogRepository dialogRepo,
                                 CaseRepository caseRepo,
                                 LocationRepository locationRepo,
                                 CharacterMapper mapper) {
        this.characterRepo = characterRepo;
        this.dialogRepo = dialogRepo;
        this.caseRepo = caseRepo;
        this.locationRepo = locationRepo;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CharacterAdminResponse> listByCase(UUID caseId) {
        if (!caseRepo.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return characterRepo.findByCaseIdOrderBySortOrderAscNameAsc(caseId).stream()
                .map(c -> mapper.toAdminResponse(c,
                        dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CharacterAdminResponse getById(UUID id) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(id));
    }

    @Transactional
    public CharacterAdminResponse create(UUID caseId, CreateCharacterRequest req) {
        if (!caseRepo.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        validateLocationInCase(caseId, req.locationId());

        GameCharacter c = new GameCharacter();
        c.setCaseId(caseId);
        c.setLocationId(req.locationId());
        c.setName(req.name());
        c.setDescription(req.description());
        c.setBiography(req.biography());
        c.setPortraitMediaId(req.portraitMediaId());
        c.setDialogueMediaId(req.dialogueMediaId());
        c.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        if (req.posX() != null) c.setPosX(req.posX());
        if (req.posY() != null) c.setPosY(req.posY());
        c.setUnlockMode(req.unlockMode() != null ? req.unlockMode() : "AUTO");
        c.setUnlockTargetId(req.unlockTargetId());
        c = characterRepo.save(c);
        return mapper.toAdminResponse(c, List.of());
    }

    @Transactional
    public CharacterAdminResponse update(UUID id, UpdateCharacterRequest req) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        validateLocationInCase(c.getCaseId(), req.locationId());

        c.setLocationId(req.locationId());
        c.setName(req.name());
        c.setDescription(req.description());
        c.setBiography(req.biography());
        c.setPortraitMediaId(req.portraitMediaId());
        c.setDialogueMediaId(req.dialogueMediaId());
        c.setSortOrder(req.sortOrder() != null ? req.sortOrder() : c.getSortOrder());
        if (req.posX() != null) c.setPosX(req.posX());
        if (req.posY() != null) c.setPosY(req.posY());
        if (req.sceneScale() != null) c.setSceneScale(clampScale(req.sceneScale()));
        if (req.sceneRotation() != null) c.setSceneRotation(normalizeRotation(req.sceneRotation()));
        if (req.unlockMode() != null) c.setUnlockMode(req.unlockMode());
        c.setUnlockTargetId(req.unlockTargetId());
        c = characterRepo.save(c);
        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(id));
    }

    @Transactional
    public CharacterAdminResponse updateTransform(UUID id, Float posX, Float posY,
                                                  Float scale, Float rotation) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        if (posX != null) c.setPosX(posX);
        if (posY != null) c.setPosY(posY);
        if (scale != null) c.setSceneScale(clampScale(scale));
        if (rotation != null) c.setSceneRotation(normalizeRotation(rotation));
        c = characterRepo.save(c);
        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(id));
    }

    @Transactional
    public CharacterAdminResponse updatePosition(UUID id, float posX, float posY) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        c.setPosX(posX);
        c.setPosY(posY);
        c = characterRepo.save(c);
        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(id));
    }

    @Transactional
    public void delete(UUID id) {
        GameCharacter c = characterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + id));
        characterRepo.delete(c);
    }

    @Transactional
    public CharacterAdminResponse addDialog(UUID characterId, CreateDialogRequest req) {
        GameCharacter c = characterRepo.findById(characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден: " + characterId));

        CharacterDialog d = new CharacterDialog();
        d.setCharacterId(characterId);
        d.setQuestion(req.question());
        d.setAnswer(req.answer());
        d.setRequiresEvidenceId(req.requiresEvidenceId());
        d.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        dialogRepo.save(d);

        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(characterId));
    }

    @Transactional
    public CharacterAdminResponse updateDialog(UUID dialogId, UpdateDialogRequest req) {
        CharacterDialog d = dialogRepo.findById(dialogId)
                .orElseThrow(() -> new ResourceNotFoundException("Диалог не найден: " + dialogId));
        d.setQuestion(req.question());
        d.setAnswer(req.answer());
        d.setRequiresEvidenceId(req.requiresEvidenceId());
        d.setSortOrder(req.sortOrder() != null ? req.sortOrder() : d.getSortOrder());
        dialogRepo.save(d);

        GameCharacter c = characterRepo.findById(d.getCharacterId())
                .orElseThrow(() -> new ResourceNotFoundException("Персонаж не найден"));
        return mapper.toAdminResponse(c,
                dialogRepo.findByCharacterIdOrderBySortOrderAscIdAsc(c.getId()));
    }

    @Transactional
    public void deleteDialog(UUID dialogId) {
        CharacterDialog d = dialogRepo.findById(dialogId)
                .orElseThrow(() -> new ResourceNotFoundException("Диалог не найден: " + dialogId));
        dialogRepo.delete(d);
    }

    private void validateLocationInCase(UUID caseId, UUID locationId) {
        if (locationId == null) return;
        Location l = locationRepo.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Локация не найдена: " + locationId));
        if (!l.getCaseId().equals(caseId)) {
            throw new BusinessException("Локация из другого кейса", HttpStatus.BAD_REQUEST);
        }
    }

    private static float clampScale(float s) {
        if (s < 0.1f) return 0.1f;
        if (s > 10f) return 10f;
        return s;
    }

    private static float normalizeRotation(float r) {
        while (r > 180f) r -= 360f;
        while (r < -180f) r += 360f;
        return r;
    }
}