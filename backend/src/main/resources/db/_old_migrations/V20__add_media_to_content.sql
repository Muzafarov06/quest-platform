-- =====================================================================
-- V20: Медиа для локаций, объектов и улик.
--
-- FK на case_media. Один media = одно изображение/аудио/видео.
-- ON DELETE SET NULL: если медиа удалили, поле у узла становится NULL,
-- сам узел остаётся.
-- =====================================================================

ALTER TABLE locations
    ADD COLUMN media_id UUID,
    ADD CONSTRAINT locations_media_fk FOREIGN KEY (media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_locations_media ON locations (media_id);

ALTER TABLE game_objects
    ADD COLUMN media_id UUID,
    ADD CONSTRAINT game_objects_media_fk FOREIGN KEY (media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_game_objects_media ON game_objects (media_id);

ALTER TABLE evidences
    ADD COLUMN media_id UUID,
    ADD CONSTRAINT evidences_media_fk FOREIGN KEY (media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_evidences_media ON evidences (media_id);

COMMENT ON COLUMN locations.media_id IS 'Фон локации (PNG, JPG)';
COMMENT ON COLUMN game_objects.media_id IS 'Спрайт объекта (PNG)';
COMMENT ON COLUMN evidences.media_id IS 'Изображение улики (PNG, JPG)';