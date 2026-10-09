package com.questplatform.engine.mapper;

import com.questplatform.engine.dto.CharacterAdminResponse;
import com.questplatform.engine.dto.CharacterDialogResponse;
import com.questplatform.engine.dto.CharacterResponse;
import com.questplatform.engine.entity.CharacterDialog;
import com.questplatform.engine.entity.GameCharacter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CharacterMapper {

    public CharacterDialogResponse toDialogResponse(CharacterDialog d) {
        if (d == null) return null;
        return new CharacterDialogResponse(
                d.getId(), d.getQuestion(), d.getAnswer(),
                d.getRequiresEvidenceId(), d.getSortOrder()
        );
    }

    public List<CharacterDialogResponse> toDialogResponseList(List<CharacterDialog> dialogs) {
        return dialogs.stream().map(this::toDialogResponse).toList();
    }

    public CharacterResponse toPlayerResponse(GameCharacter c, List<CharacterDialog> dialogs) {
        if (c == null) return null;
        return new CharacterResponse(
                c.getId(),
                c.getCaseId(),
                c.getLocationId(),
                c.getName(),
                c.getDescription(),
                c.getPortraitMediaId(),
                c.getDialogueMediaId(),
                c.getSortOrder(),
                c.getPosX(),
                c.getPosY(),
                c.getSceneScale(),
                c.getSceneRotation(),
                c.getUnlockMode(),
                c.getUnlockTargetId(),
                toDialogResponseList(dialogs)
        );
    }

    public CharacterAdminResponse toAdminResponse(GameCharacter c, List<CharacterDialog> dialogs) {
        if (c == null) return null;
        return new CharacterAdminResponse(
                c.getId(),
                c.getCaseId(),
                c.getLocationId(),
                c.getName(),
                c.getDescription(),
                c.getBiography(),
                c.getPortraitMediaId(),
                c.getDialogueMediaId(),
                c.getSortOrder(),
                c.getPosX(),
                c.getPosY(),
                c.getSceneScale(),
                c.getSceneRotation(),
                c.getUnlockMode(),
                c.getUnlockTargetId(),
                toDialogResponseList(dialogs)
        );
    }
}