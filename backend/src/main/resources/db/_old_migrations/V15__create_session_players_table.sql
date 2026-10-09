-- =====================================================================
-- V15: Игроки в сессиях.
--
-- Игрок может быть зарегистрированным (user_id) или гостем
-- (guest_token). Гость не требует регистрации — только displayName
-- и аватар.
-- =====================================================================

CREATE TABLE session_players (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id        UUID         NOT NULL,
    user_id           UUID,

    guest_token       UUID,
    display_name      VARCHAR(50)  NOT NULL,
    avatar_key        VARCHAR(50)  NOT NULL DEFAULT 'default',

    joined_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_seen_at      TIMESTAMPTZ,
    is_active         BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT sp_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT sp_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT sp_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL) OR
        (user_id IS NULL AND guest_token IS NOT NULL)
    ),
    CONSTRAINT sp_unique_user UNIQUE (session_id, user_id),
    CONSTRAINT sp_unique_guest UNIQUE (session_id, guest_token)
);

CREATE INDEX idx_sp_session ON session_players (session_id);
CREATE INDEX idx_sp_user ON session_players (user_id);

COMMENT ON TABLE session_players IS 'Игроки в сессии';
COMMENT ON COLUMN session_players.user_id IS 'UUID зарегистрированного пользователя (если есть)';
COMMENT ON COLUMN session_players.guest_token IS 'UUID гостя без регистрации';
COMMENT ON COLUMN session_players.display_name IS 'Имя в комнате (у гостя — введённое)';
COMMENT ON COLUMN session_players.avatar_key IS 'Ключ аватара';
COMMENT ON COLUMN session_players.is_active IS 'Активен ли в сессии';