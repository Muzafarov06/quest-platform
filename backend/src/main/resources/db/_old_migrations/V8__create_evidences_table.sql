-- =====================================================================
-- V8: Таблица улик.
--
-- Улика — фрагмент информации, найденный игроком: документ, фото,
-- аудиозапись, показание. Улика привязана либо к объекту (через клик),
-- либо к локации напрямую. Может быть ни к чему не привязана —
-- тогда выдаётся скриптовым событием (позже).
-- =====================================================================

CREATE TABLE evidences (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,
    object_id       UUID,
    location_id     UUID,

    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    content_text    TEXT,

    evidence_type   VARCHAR(30)  NOT NULL DEFAULT 'DOCUMENT',
    importance      VARCHAR(20)  NOT NULL DEFAULT 'SUPPORTING',

    sort_order      INT          NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT evidences_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT evidences_object_fk FOREIGN KEY (object_id) REFERENCES game_objects (id) ON DELETE SET NULL,
    CONSTRAINT evidences_location_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL,

    CONSTRAINT evidences_type_check CHECK (evidence_type IN (
        'DOCUMENT', 'PHOTO', 'AUDIO', 'VIDEO', 'PHYSICAL',
        'DIGITAL', 'TESTIMONY', 'OTHER'
    )),

    CONSTRAINT evidences_importance_check CHECK (importance IN (
        'KEY', 'SUPPORTING', 'RED_HERRING'
    ))
);

CREATE INDEX idx_evidences_case ON evidences (case_id);
CREATE INDEX idx_evidences_object ON evidences (object_id);
CREATE INDEX idx_evidences_location ON evidences (location_id);

COMMENT ON TABLE evidences IS 'Улики внутри кейса';
COMMENT ON COLUMN evidences.case_id IS 'Кейс, которому принадлежит улика';
COMMENT ON COLUMN evidences.object_id IS 'Объект, через который находится улика (опционально)';
COMMENT ON COLUMN evidences.location_id IS 'Локация улики (опционально)';
COMMENT ON COLUMN evidences.title IS 'Название: «SMS от Андрея»';
COMMENT ON COLUMN evidences.description IS 'Краткое описание';
COMMENT ON COLUMN evidences.content_text IS 'Содержимое улики: текст письма, показания';
COMMENT ON COLUMN evidences.evidence_type IS 'DOCUMENT, PHOTO, AUDIO, VIDEO, PHYSICAL, DIGITAL, TESTIMONY, OTHER';
COMMENT ON COLUMN evidences.importance IS 'KEY, SUPPORTING, RED_HERRING';
COMMENT ON COLUMN evidences.sort_order IS 'Порядок отображения';
COMMENT ON COLUMN evidences.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN evidences.updated_at IS 'UTC, обновляется при изменении';