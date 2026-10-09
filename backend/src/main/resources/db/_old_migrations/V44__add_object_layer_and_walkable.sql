-- =====================================================================
-- V44: слой отрисовки и проходимость объекта.
--
-- render_layer: целое -1 / 0 / +1.
--   -1 — всегда под остальными объектами (фон: двери, лестницы).
--    0 — обычный порядок по Y (по умолчанию).
--   +1 — всегда поверх остальных (мел, оружие, документы, улики).
--
-- walkable: true — игрок может проходить сквозь объект
--   (мел на полу, рисунок на стене, фотография).
--   false — объект непроходим (мебель, дерево, дверь).
--
-- Значения по умолчанию:
--   render_layer = 0 (обычный слой по Y)
--   walkable = false (непроходим)
-- =====================================================================

ALTER TABLE game_objects
    ADD COLUMN render_layer SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN walkable BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE game_objects
    ADD CONSTRAINT game_objects_render_layer_check
        CHECK (render_layer BETWEEN -1 AND 1);

COMMENT ON COLUMN game_objects.render_layer IS
    'Слой отрисовки: -1 под всем, 0 по Y, +1 поверх всего';
COMMENT ON COLUMN game_objects.walkable IS
    'true — игрок может проходить сквозь объект';