package com.questplatform.admin.dto;

import com.questplatform.locations.dto.LocationConnectionResponse;
import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.objects.dto.GameObjectResponse;

import java.util.List;

/**
 * Полная сцена локации для визуального редактора.
 *
 * <p>Отдаём одним запросом:</p>
 * <ul>
 *   <li>саму локацию (фон, точка входа, метаданные);</li>
 *   <li>объекты внутри (с координатами);</li>
 *   <li>исходящие переходы (с координатами, если заданы).</li>
 * </ul>
 */
public record LocationSceneResponse(
        LocationResponse location,
        List<GameObjectResponse> objects,
        List<LocationConnectionResponse> connections
) {
}