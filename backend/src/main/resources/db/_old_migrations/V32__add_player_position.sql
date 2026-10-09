-- =====================================================================
-- V32: Позиция игрока в комнате ожидания.
--
-- Храним координаты 0-100 (проценты от размера комнаты). Так комната
-- масштабируется под любой экран. Facing — для будущих анимаций.
-- =====================================================================

ALTER TABLE session_players
    ADD COLUMN pos_x  REAL         NOT NULL DEFAULT 50,
    ADD COLUMN pos_y  REAL         NOT NULL DEFAULT 50,
    ADD COLUMN facing VARCHAR(10)  NOT NULL DEFAULT 'DOWN';

COMMENT ON COLUMN session_players.pos_x IS 'Позиция X в комнате (0-100)';
COMMENT ON COLUMN session_players.pos_y IS 'Позиция Y в комнате (0-100)';
COMMENT ON COLUMN session_players.facing IS 'Направление: UP, DOWN, LEFT, RIGHT';