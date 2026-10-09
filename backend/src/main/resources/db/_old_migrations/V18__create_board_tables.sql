-- =====================================================================
-- V18: Доска расследования.
--
-- board_items — карточки (улики, заметки, гипотезы).
-- board_connections — связи между карточками.
-- =====================================================================

CREATE TABLE board_items (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id        UUID         NOT NULL,
    created_by        UUID         NOT NULL,

    item_type         VARCHAR(20)  NOT NULL DEFAULT 'NOTE',
    title             VARCHAR(200),
    content           TEXT,

    evidence_id       UUID,

    pos_x             REAL         NOT NULL DEFAULT 0,
    pos_y             REAL         NOT NULL DEFAULT 0,

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT bi_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT bi_player_fk FOREIGN KEY (created_by) REFERENCES session_players (id) ON DELETE CASCADE,
    CONSTRAINT bi_evidence_fk FOREIGN KEY (evidence_id) REFERENCES evidences (id) ON DELETE SET NULL,
    CONSTRAINT bi_type_check CHECK (item_type IN ('EVIDENCE', 'NOTE', 'HYPOTHESIS', 'QUESTION'))
);

CREATE INDEX idx_bi_session ON board_items (session_id);
CREATE INDEX idx_bi_evidence ON board_items (evidence_id);

COMMENT ON TABLE board_items IS 'Карточки на доске расследования';
COMMENT ON COLUMN board_items.item_type IS 'EVIDENCE, NOTE, HYPOTHESIS, QUESTION';
COMMENT ON COLUMN board_items.evidence_id IS 'Если тип EVIDENCE — ссылка на улику';

-- ---------------------------------------------------------------------

CREATE TABLE board_connections (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id        UUID         NOT NULL,
    from_item_id      UUID         NOT NULL,
    to_item_id        UUID         NOT NULL,
    label             VARCHAR(100),

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT bc_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT bc_from_fk FOREIGN KEY (from_item_id) REFERENCES board_items (id) ON DELETE CASCADE,
    CONSTRAINT bc_to_fk FOREIGN KEY (to_item_id) REFERENCES board_items (id) ON DELETE CASCADE,
    CONSTRAINT bc_no_self CHECK (from_item_id <> to_item_id),
    CONSTRAINT bc_unique UNIQUE (session_id, from_item_id, to_item_id)
);

CREATE INDEX idx_bc_session ON board_connections (session_id);

COMMENT ON TABLE board_connections IS 'Связи между карточками на доске';