-- =====================================================================
-- V6: Таблица игровых объектов.
--
-- Объект — интерактивный элемент внутри локации: телефон, дверь, сейф.
-- Игрок кликает на объект, чтобы взаимодействовать с ним.
-- Позже улики будут привязаны к объектам.
-- =====================================================================

CREATE TABLE game_objects (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    location_id     UUID         NOT NULL,

    name            VARCHAR(200) NOT NULL,
    description     TEXT,

    object_type     VARCHAR(30)  NOT NULL DEFAULT 'ITEM',
    state           VARCHAR(30)  NOT NULL DEFAULT 'CLOSED',

    sort_order      INT          NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT game_objects_location_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
    CONSTRAINT game_objects_type_check CHECK (object_type IN (
        'TELEPHONE', 'COMPUTER', 'DOOR', 'SAFE', 'CONTAINER', 'DOCUMENT', 'ITEM', 'OTHER'
    )),
    CONSTRAINT game_objects_state_check CHECK (state IN (
        'CLOSED', 'OPEN', 'LOCKED', 'BROKEN'
    ))
);

CREATE INDEX idx_game_objects_location ON game_objects (location_id);
CREATE INDEX idx_game_objects_location_sort ON game_objects (location_id, sort_order);

COMMENT ON TABLE game_objects IS 'Интерактивные объекты внутри локаций';
COMMENT ON COLUMN game_objects.location_id IS 'Локация, в которой находится объект';
COMMENT ON COLUMN game_objects.name IS 'Название: «Телефон Андрея»';
COMMENT ON COLUMN game_objects.description IS 'Описание объекта';
COMMENT ON COLUMN game_objects.object_type IS 'TELEPHONE, COMPUTER, DOOR, SAFE, CONTAINER, DOCUMENT, ITEM, OTHER';
COMMENT ON COLUMN game_objects.state IS 'CLOSED, OPEN, LOCKED, BROKEN';
COMMENT ON COLUMN game_objects.sort_order IS 'Порядок отображения в локации';
COMMENT ON COLUMN game_objects.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN game_objects.updated_at IS 'UTC, обновляется при изменении';