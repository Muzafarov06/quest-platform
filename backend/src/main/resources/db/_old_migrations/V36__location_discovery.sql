-- =====================================================================
-- V36: Постепенное открытие локаций.
--
-- По умолчанию все локации открыты сразу (ALWAYS) — обратная
-- совместимость. Можно настроить открытие по:
--   ON_EVIDENCE  — после находки улики
--   ON_DIALOG    — после диалога с персонажем
--   ON_LOCATION  — после посещения другой локации
--   ON_MANUAL    — вручную через событие (звонок, координаты)
--
-- discovery_target_id — UUID улики / персонажа / локации, к чему привязано.
-- discovery_hint     — текст, показываемый игроку в момент открытия.
-- =====================================================================

ALTER TABLE locations
    ADD COLUMN discovery_mode       VARCHAR(20) NOT NULL DEFAULT 'ALWAYS',
    ADD COLUMN discovery_target_id  UUID,
    ADD COLUMN discovery_hint       TEXT;

ALTER TABLE locations
    ADD CONSTRAINT locations_discovery_mode_check
        CHECK (discovery_mode IN ('ALWAYS', 'ON_EVIDENCE', 'ON_DIALOG', 'ON_LOCATION', 'ON_MANUAL'));

COMMENT ON COLUMN locations.discovery_mode IS
    'Как открывается локация: ALWAYS | ON_EVIDENCE | ON_DIALOG | ON_LOCATION | ON_MANUAL';
COMMENT ON COLUMN locations.discovery_target_id IS
    'UUID цели-триггера (улики/персонажа/локации). NULL для ALWAYS/ON_MANUAL.';
COMMENT ON COLUMN locations.discovery_hint IS
    'Текст-подсказка в момент открытия: «Вы узнали адрес садика».';

-- Таблица: какие локации открыты в конкретной сессии.
-- Отдельно от game_actions — там просто журнал «что произошло».
-- Здесь — «что стало доступно команде».
CREATE TABLE session_unlocked_locations (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID         NOT NULL,
    location_id   UUID         NOT NULL,
    unlocked_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    unlocked_by   UUID,

    CONSTRAINT sul_session_fk
        FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT sul_location_fk
        FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
    CONSTRAINT sul_unique
        UNIQUE (session_id, location_id)
);

CREATE INDEX idx_sul_session ON session_unlocked_locations (session_id);

COMMENT ON TABLE session_unlocked_locations IS
    'Локации, открытые в конкретной сессии (dynamic unlock).';