-- =====================================================================
-- V39: Координаты персонажа на сцене локации.
--
-- Как у game_objects.pos_x/pos_y — позиция в % (0–100) относительно сцены.
-- Позволяет расставлять персонажей в редакторе сцены.
-- =====================================================================

ALTER TABLE characters
    ADD COLUMN pos_x REAL NOT NULL DEFAULT 50,
    ADD COLUMN pos_y REAL NOT NULL DEFAULT 50;

COMMENT ON COLUMN characters.pos_x IS 'X персонажа на сцене локации (0–100%%)';
COMMENT ON COLUMN characters.pos_y IS 'Y персонажа на сцене локации (0–100%%)';