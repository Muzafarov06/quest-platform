-- =====================================================================
-- V46: фотография персонажа для диалогового окна.
--
-- portrait_media_id — спрайт на сцене (небольшая фигурка на полу).
-- dialogue_media_id — большая фотография в полный рост для окна
--                     разговора с персонажем. Опционально.
--
-- Если не задана — окно разговора использует portrait_media_id.
-- =====================================================================

ALTER TABLE characters
    ADD COLUMN dialogue_media_id UUID,
    ADD CONSTRAINT characters_dialogue_media_fk
        FOREIGN KEY (dialogue_media_id)
        REFERENCES case_media (id) ON DELETE SET NULL;

CREATE INDEX idx_characters_dialogue_media ON characters (dialogue_media_id);

COMMENT ON COLUMN characters.dialogue_media_id IS
    'Большая фотография для окна диалога. NULL — используется portrait_media_id.';