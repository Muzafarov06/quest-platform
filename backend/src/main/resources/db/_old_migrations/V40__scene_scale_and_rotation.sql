-- =====================================================================
-- V40: масштаб и поворот маркеров на сцене локации.
--
-- Базовый размер рисуется фронтом (baseSize * scale), scale — множитель.
-- rotation — угол в градусах (-180..180).
--
-- Для locations — для под-локаций, отображаемых на сцене родителя.
-- (На карте дела по-прежнему map_x/map_y.)
-- =====================================================================

ALTER TABLE game_objects
    ADD COLUMN scene_scale    REAL NOT NULL DEFAULT 1.0,
    ADD COLUMN scene_rotation REAL NOT NULL DEFAULT 0.0;

ALTER TABLE characters
    ADD COLUMN scene_scale    REAL NOT NULL DEFAULT 1.0,
    ADD COLUMN scene_rotation REAL NOT NULL DEFAULT 0.0;

ALTER TABLE locations
    ADD COLUMN scene_scale    REAL NOT NULL DEFAULT 1.0,
    ADD COLUMN scene_rotation REAL NOT NULL DEFAULT 0.0;

COMMENT ON COLUMN game_objects.scene_scale    IS 'Множитель размера на сцене (0.1–10.0)';
COMMENT ON COLUMN game_objects.scene_rotation IS 'Угол поворота, градусы (-180–180)';
COMMENT ON COLUMN characters.scene_scale      IS 'Множитель размера на сцене (0.1–10.0)';
COMMENT ON COLUMN characters.scene_rotation   IS 'Угол поворота, градусы (-180–180)';
COMMENT ON COLUMN locations.scene_scale       IS 'Множитель размера под-локации (0.1–10.0)';
COMMENT ON COLUMN locations.scene_rotation    IS 'Угол поворота, градусы (-180–180)';