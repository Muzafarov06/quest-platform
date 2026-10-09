-- =====================================================================
-- V42: PNG-спрайт локации для карты дела.
--
-- Отдельно от:
--   locations.media_id          — фон сцены (интерьер)
--   locations.preview_media_id  — превью на весь экран при клике
--
-- Здесь — компактный PNG, который рисуется прямо на карте дела.
--
-- ON DELETE SET NULL: удалили медиа — спрайт очистился, локация цела.
-- =====================================================================

ALTER TABLE locations
    ADD COLUMN map_media_id UUID,
    ADD CONSTRAINT locations_map_media_fk
        FOREIGN KEY (map_media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_locations_map_media ON locations (map_media_id);

COMMENT ON COLUMN locations.map_media_id IS
    'PNG-спрайт локации для карты дела. Отдельно от media_id (фон сцены) и preview_media_id (большое превью).';