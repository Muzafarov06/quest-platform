-- =====================================================================
-- V12: События и условия.
--
-- Условие — правило «когда срабатывает». Событие — что произойдёт
-- при срабатывании. Событие может иметь несколько условий (AND).
--
-- Пока — минимальная модель:
--   conditions:  что проверяем (объект, локация, улика)
--   events:      что делаем (показать сообщение, открыть объект,
--                выдать улику, разблокировать локацию)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Условия
-- ---------------------------------------------------------------------

CREATE TABLE game_conditions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,

    condition_type  VARCHAR(30)  NOT NULL,
    target_id       UUID,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT gc_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT gc_type_check CHECK (condition_type IN (
        'OBJECT_INTERACTED',
        'LOCATION_VISITED',
        'EVIDENCE_DISCOVERED',
        'PUZZLE_SOLVED'
    ))
);

CREATE INDEX idx_gc_case ON game_conditions (case_id);
CREATE INDEX idx_gc_type_target ON game_conditions (condition_type, target_id);

COMMENT ON TABLE game_conditions IS 'Условия срабатывания событий';
COMMENT ON COLUMN game_conditions.condition_type IS 'OBJECT_INTERACTED, LOCATION_VISITED, EVIDENCE_DISCOVERED, PUZZLE_SOLVED';
COMMENT ON COLUMN game_conditions.target_id IS 'UUID объекта/локации/улики, к чему привязано условие';

-- ---------------------------------------------------------------------
-- События
-- ---------------------------------------------------------------------

CREATE TABLE game_events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,
    condition_id    UUID,

    event_type      VARCHAR(30)  NOT NULL,
    target_id       UUID,
    message         TEXT,

    once            BOOLEAN      NOT NULL DEFAULT true,
    sort_order      INT          NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ge_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT ge_condition_fk FOREIGN KEY (condition_id) REFERENCES game_conditions (id) ON DELETE CASCADE,
    CONSTRAINT ge_type_check CHECK (event_type IN (
        'SHOW_MESSAGE',
        'REVEAL_EVIDENCE',
        'UNLOCK_OBJECT',
        'UNLOCK_LOCATION'
    ))
);

CREATE INDEX idx_ge_case ON game_events (case_id);
CREATE INDEX idx_ge_condition ON game_events (condition_id);

COMMENT ON TABLE game_events IS 'События, срабатывающие по условиям';
COMMENT ON COLUMN game_events.event_type IS 'SHOW_MESSAGE, REVEAL_EVIDENCE, UNLOCK_OBJECT, UNLOCK_LOCATION';
COMMENT ON COLUMN game_events.target_id IS 'UUID сущности, с которой работает событие';
COMMENT ON COLUMN game_events.message IS 'Текст сообщения (для SHOW_MESSAGE)';
COMMENT ON COLUMN game_events.once IS 'Сработать только один раз за сессию';