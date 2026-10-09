-- =====================================================================
-- V50: текущая локация игрока в сессии.
--
-- Раньше session_players хранил только x/y/facing — общие для всех
-- сцен. Когда один игрок в доме, а другой на карте, первый видел
-- аватар второго поверх своей сцены.
--
-- Теперь: current_location_id = UUID локации, где игрок сейчас.
-- NULL означает «на карте дела», вне сцены.
-- =====================================================================

ALTER TABLE session_players
    ADD COLUMN current_location_id UUID;

ALTER TABLE session_players
    ADD CONSTRAINT sp_current_location_fk FOREIGN KEY (current_location_id)
        REFERENCES locations (id) ON DELETE SET NULL;

CREATE INDEX idx_sp_current_location ON session_players (current_location_id);

COMMENT ON COLUMN session_players.current_location_id IS
    'UUID локации, где игрок сейчас. NULL — на карте дела.';