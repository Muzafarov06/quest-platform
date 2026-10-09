-- =====================================================================
-- V34: Флаг готовности игрока в лобби.
--
-- Когда все активные игроки нажали «Готов» — сессия стартует
-- автоматически (см. SessionService.maybeStartWhenAllReady).
-- =====================================================================

ALTER TABLE session_players
    ADD COLUMN is_ready BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN session_players.is_ready IS 'Готовность игрока к старту';