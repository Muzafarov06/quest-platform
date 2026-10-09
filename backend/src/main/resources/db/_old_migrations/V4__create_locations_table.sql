-- =====================================================================
-- V4: Таблица локаций.
--
-- Локация — часть кейса: дом, комната, улица, лес, машина.
-- Иерархия: location может содержать другие location (parent_id).
-- Например: Дом → Первый этаж → Гостиная.
-- =====================================================================

CREATE TABLE locations (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,
    parent_id       UUID,

    name            VARCHAR(200) NOT NULL,
    description     TEXT,

    location_type   VARCHAR(30)  NOT NULL DEFAULT 'ROOM',
    sort_order      INT          NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT locations_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT locations_parent_fk FOREIGN KEY (parent_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT locations_type_check CHECK (location_type IN (
        'HOUSE', 'ROOM', 'STREET', 'FOREST', 'VEHICLE',
        'DIGITAL', 'BUILDING', 'OTHER'
    )),
    CONSTRAINT locations_parent_not_self CHECK (id <> parent_id)
);

CREATE INDEX idx_locations_case ON locations (case_id);
CREATE INDEX idx_locations_parent ON locations (parent_id);
CREATE INDEX idx_locations_case_type ON locations (case_id, location_type);

COMMENT ON TABLE locations IS 'Локации внутри кейса';
COMMENT ON COLUMN locations.case_id IS 'Кейс, которому принадлежит локация';
COMMENT ON COLUMN locations.parent_id IS 'Родительская локация (для вложенности)';
COMMENT ON COLUMN locations.name IS 'Название: «Гостиная», «Улица Ленина»';
COMMENT ON COLUMN locations.description IS 'Описание локации';
COMMENT ON COLUMN locations.location_type IS 'Тип: HOUSE, ROOM, STREET, FOREST, VEHICLE, DIGITAL, BUILDING, OTHER';
COMMENT ON COLUMN locations.sort_order IS 'Порядок отображения внутри родителя';
COMMENT ON COLUMN locations.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN locations.updated_at IS 'UTC, обновляется при изменении';