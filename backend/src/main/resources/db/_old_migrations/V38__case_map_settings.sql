-- =====================================================================
-- V38: Карта местности кейса.
--
-- Кейс получает:
--   map_media_id       — фоновая картинка карты (например, схема города)
--   entry_location_id  — стартовая локация: где появляется игрок при старте
--   map_width / _height — размеры полотна карты (для pan-скролла)
--
-- Отдельный слой от locations (у локаций своя сцена с точками входа),
-- здесь — общий фон и точка старта игры.
-- =====================================================================

ALTER TABLE cases
    ADD COLUMN map_media_id      UUID,
    ADD COLUMN entry_location_id UUID,
    ADD COLUMN map_width         INT NOT NULL DEFAULT 2400,
    ADD COLUMN map_height        INT NOT NULL DEFAULT 1600;

ALTER TABLE cases
    ADD CONSTRAINT cases_map_media_fk
        FOREIGN KEY (map_media_id) REFERENCES case_media (id) ON DELETE SET NULL,
    ADD CONSTRAINT cases_entry_location_fk
        FOREIGN KEY (entry_location_id) REFERENCES locations (id) ON DELETE SET NULL;

COMMENT ON COLUMN cases.map_media_id IS
    'Фон карты местности (PNG-схема города/леса и т.д.)';
COMMENT ON COLUMN cases.entry_location_id IS
    'Стартовая локация: где появляется игрок при старте сессии';
COMMENT ON COLUMN cases.map_width IS 'Ширина полотна карты дела (px)';
COMMENT ON COLUMN cases.map_height IS 'Высота полотна карты дела (px)';