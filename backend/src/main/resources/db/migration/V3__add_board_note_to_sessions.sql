--
-- V3: Общая заметка доски расследования.
-- Хранится в game_sessions, синхронизируется по WebSocket.
-- Плюс индекс для быстрого count улик на доске (auto-layout).
--

ALTER TABLE public.game_sessions
    ADD COLUMN board_note_text TEXT,
    ADD COLUMN board_note_updated_at TIMESTAMPTZ,
    ADD COLUMN board_note_updated_by UUID;

CREATE INDEX IF NOT EXISTS idx_board_items_session_type
    ON public.board_items (session_id, item_type);