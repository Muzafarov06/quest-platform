-- =====================================================================
-- V25: Персонажи и их диалоги.
--
-- Персонаж привязан к кейсу. Опционально — к локации (тогда виден игроку
-- внутри этой локации). biography — скрытая от игрока предыстория
-- для админа (мотивация, алиби, что скрывает).
--
-- character_dialogs — пары вопрос/ответ. requires_evidence_id —
-- опциональное условие: вопрос открывается после находки улики.
-- =====================================================================

CREATE TABLE characters (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID         NOT NULL,
    location_id         UUID,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    biography           TEXT,
    portrait_media_id   UUID,
    sort_order          INT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ch_case_fk FOREIGN KEY (case_id)
        REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT ch_location_fk FOREIGN KEY (location_id)
        REFERENCES locations (id) ON DELETE SET NULL,
    CONSTRAINT ch_portrait_fk FOREIGN KEY (portrait_media_id)
        REFERENCES case_media (id) ON DELETE SET NULL
);

COMMENT ON TABLE characters IS 'Персонажи кейса';
COMMENT ON COLUMN characters.biography IS 'Скрытая предыстория (только для админа)';

CREATE INDEX idx_characters_case ON characters (case_id);
CREATE INDEX idx_characters_location ON characters (location_id);

CREATE TABLE character_dialogs (
    id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id           UUID         NOT NULL,
    question               TEXT         NOT NULL,
    answer                 TEXT         NOT NULL,
    requires_evidence_id   UUID,
    sort_order             INT          NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT cd_character_fk FOREIGN KEY (character_id)
        REFERENCES characters (id) ON DELETE CASCADE,
    CONSTRAINT cd_evidence_fk FOREIGN KEY (requires_evidence_id)
        REFERENCES evidences (id) ON DELETE SET NULL
);

CREATE INDEX idx_dialogs_character ON character_dialogs (character_id);