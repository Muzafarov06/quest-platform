-- =====================================================================
-- V14: Игровые сессии.
--
-- Сессия — конкретное прохождение кейса командой.
-- Владелец создаёт сессию, получает код комнаты, приглашает друзей.
-- =====================================================================

CREATE TABLE game_sessions (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id           UUID         NOT NULL,
    owner_user_id     UUID         NOT NULL,

    room_code         VARCHAR(10)  NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'LOBBY',

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    started_at        TIMESTAMPTZ,
    finished_at       TIMESTAMPTZ,

    CONSTRAINT gs_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE RESTRICT,
    CONSTRAINT gs_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT gs_room_code_unique UNIQUE (room_code),
    CONSTRAINT gs_status_check CHECK (status IN ('LOBBY', 'ACTIVE', 'FINISHED', 'ABANDONED'))
);

CREATE INDEX idx_gs_owner ON game_sessions (owner_user_id);
CREATE INDEX idx_gs_case ON game_sessions (case_id);
CREATE INDEX idx_gs_status ON game_sessions (status);
CREATE INDEX idx_gs_room_code ON game_sessions (room_code);

COMMENT ON TABLE game_sessions IS 'Игровые сессии (прохождения кейсов)';
COMMENT ON COLUMN game_sessions.case_id IS 'Кейс, который проходят';
COMMENT ON COLUMN game_sessions.owner_user_id IS 'Создатель сессии';
COMMENT ON COLUMN game_sessions.room_code IS 'Короткий код для приглашения (CASE-8F42KD)';
COMMENT ON COLUMN game_sessions.status IS 'LOBBY | ACTIVE | FINISHED | ABANDONED';
COMMENT ON COLUMN game_sessions.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN game_sessions.started_at IS 'Когда владелец нажал «Начать»';
COMMENT ON COLUMN game_sessions.finished_at IS 'Когда сессия завершена';