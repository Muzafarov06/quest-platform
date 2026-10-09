-- =====================================================================
-- V16: Журнал действий игроков в сессии.
--
-- Каждое действие (клик на объект, посещение локации, находка улики)
-- пишется сюда. Из журнала строится состояние: что уже сработало,
-- где побывали, что нашли.
-- =====================================================================

CREATE TABLE session_actions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id      UUID         NOT NULL,
    player_id       UUID         NOT NULL,

    action_type     VARCHAR(30)  NOT NULL,
    target_id       UUID,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT sa_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT sa_player_fk FOREIGN KEY (player_id) REFERENCES session_players (id) ON DELETE CASCADE,
    CONSTRAINT sa_action_check CHECK (action_type IN (
        'OBJECT_INTERACTED',
        'LOCATION_VISITED',
        'EVIDENCE_DISCOVERED',
        'PUZZLE_SOLVED'
    ))
);

CREATE INDEX idx_sa_session ON session_actions (session_id);
CREATE INDEX idx_sa_session_action ON session_actions (session_id, action_type);
CREATE INDEX idx_sa_session_action_target ON session_actions (session_id, action_type, target_id);

COMMENT ON TABLE session_actions IS 'Журнал действий игроков в сессии';
COMMENT ON COLUMN session_actions.session_id IS 'Сессия';
COMMENT ON COLUMN session_actions.player_id IS 'Игрок, совершивший действие';
COMMENT ON COLUMN session_actions.action_type IS 'Тип действия';
COMMENT ON COLUMN session_actions.target_id IS 'UUID объекта/локации/улики, к чему действие';