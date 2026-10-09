package com.questplatform.figures.controller;

import com.questplatform.figures.dto.FigureResponse;
import com.questplatform.figures.service.FigureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class FigureController {

    private final FigureService figureService;

    public FigureController(FigureService figureService) {
        this.figureService = figureService;
    }

    /** Публичный список активных фигурок — для фронта. */
    @GetMapping("/api/figures")
    public ResponseEntity<List<FigureResponse>> list() {
        return ResponseEntity.ok(figureService.listActive());
    }
}