package com.questplatform.admin.controller;

import com.questplatform.admin.dto.TransformRequest;
import com.questplatform.engine.dto.CharacterAdminResponse;
import com.questplatform.engine.dto.CreateCharacterRequest;
import com.questplatform.engine.dto.CreateDialogRequest;
import com.questplatform.engine.dto.UpdateCharacterRequest;
import com.questplatform.engine.dto.UpdateDialogRequest;
import com.questplatform.engine.service.AdminCharacterService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCharacterController {

    private final AdminCharacterService service;

    public AdminCharacterController(AdminCharacterService service) {
        this.service = service;
    }

    @GetMapping("/cases/{caseId}/characters")
    public ResponseEntity<List<CharacterAdminResponse>> listByCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(service.listByCase(caseId));
    }

    @GetMapping("/characters/{id}")
    public ResponseEntity<CharacterAdminResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/cases/{caseId}/characters")
    public ResponseEntity<CharacterAdminResponse> create(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateCharacterRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(caseId, req));
    }

    @PutMapping("/characters/{id}")
    public ResponseEntity<CharacterAdminResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCharacterRequest req
    ) {
        return ResponseEntity.ok(service.update(id, req));
    }

    /** Старый PATCH — только позиция на сцене. */
    @PatchMapping("/characters/{id}/position")
    public ResponseEntity<CharacterAdminResponse> updatePosition(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePositionRequest req
    ) {
        return ResponseEntity.ok(service.updatePosition(id, req.posX(), req.posY()));
    }

    /** PATCH позиции/масштаба/поворота на сцене. */
    @PatchMapping("/characters/{id}/transform")
    public ResponseEntity<CharacterAdminResponse> updateTransform(
            @PathVariable UUID id,
            @Valid @RequestBody TransformRequest req
    ) {
        return ResponseEntity.ok(service.updateTransform(
                id, req.posX(), req.posY(), req.scale(), req.rotation()));
    }

    @DeleteMapping("/characters/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Диалоги ----------

    @PostMapping("/characters/{characterId}/dialogs")
    public ResponseEntity<CharacterAdminResponse> addDialog(
            @PathVariable UUID characterId,
            @Valid @RequestBody CreateDialogRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addDialog(characterId, req));
    }

    @PutMapping("/dialogs/{dialogId}")
    public ResponseEntity<CharacterAdminResponse> updateDialog(
            @PathVariable UUID dialogId,
            @Valid @RequestBody UpdateDialogRequest req
    ) {
        return ResponseEntity.ok(service.updateDialog(dialogId, req));
    }

    @DeleteMapping("/dialogs/{dialogId}")
    public ResponseEntity<Void> deleteDialog(@PathVariable UUID dialogId) {
        service.deleteDialog(dialogId);
        return ResponseEntity.noContent().build();
    }

    // ---------- DTO ----------

    public record UpdatePositionRequest(
            @NotNull @Min(0) @Max(100) Float posX,
            @NotNull @Min(0) @Max(100) Float posY
    ) {}
}