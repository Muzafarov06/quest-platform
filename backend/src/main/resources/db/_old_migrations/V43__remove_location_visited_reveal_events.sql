-- =====================================================================
-- V43: убираем автоматическую выдачу улик при входе в локацию.
--
-- Раньше (V30, блок 2) для улик без object_id создавались условия
-- LOCATION_VISITED → REVEAL_EVIDENCE. Это приводило к тому, что при
-- входе в локацию сразу вылезали улики.
--
-- Теперь улики выдаются только при клике на объект
-- (см. SessionObjectService.inspect).
--
-- Условия LOCATION_VISITED, не привязанные к REVEAL_EVIDENCE
-- (например, для UNLOCK_LOCATION), не трогаем.
-- =====================================================================

DELETE FROM game_events
WHERE event_type = 'REVEAL_EVIDENCE'
  AND condition_id IN (
    SELECT id FROM game_conditions
    WHERE condition_type = 'LOCATION_VISITED'
  );

DELETE FROM game_conditions
WHERE condition_type = 'LOCATION_VISITED'
  AND id NOT IN (
    SELECT DISTINCT condition_id
    FROM game_events
    WHERE condition_id IS NOT NULL
  );