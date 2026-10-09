-- =====================================================================
-- V41: Превью локации для карты дела.
--
-- Отдельно от locations.media_id (фон сцены). Здесь — картинка,
-- которую игрок видит в предпросмотре локации на карте дела.
--
-- ON DELETE SET NULL: удалили медиа — превью очистилось, локация цела.
-- =====================================================================

ALTER TABLE locations
    ADD COLUMN preview_media_id UUID,
    ADD CONSTRAINT locations_preview_media_fk
        FOREIGN KEY (preview_media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_locations_preview_media ON locations (preview_media_id);

COMMENT ON COLUMN locations.preview_media_id IS
    'Превью локации для карты дела. Отдельно от media_id (фон сцены).';