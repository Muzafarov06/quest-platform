-- =====================================================================
-- V10: Таблица переходов между локациями.
--
-- Переход — направленная связь from_location → to_location с
-- опциональной меткой («Выйти на улицу», «Войти в дом») и
-- условием доступности (позже: заперто, нужен ключ).
-- =====================================================================

CREATE TABLE location_connections (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,
    from_location_id UUID        NOT NULL,
    to_location_id  UUID         NOT NULL,

    label           VARCHAR(200),
    sort_order      INT          NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT lc_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT lc_from_fk FOREIGN KEY (from_location_id) REFERENCES locations (id) ON DELETE CASCADE,
    CONSTRAINT lc_to_fk FOREIGN KEY (to_location_id) REFERENCES locations (id) ON DELETE CASCADE,
    CONSTRAINT lc_no_self_loop CHECK (from_location_id <> to_location_id),
    CONSTRAINT lc_unique UNIQUE (case_id, from_location_id, to_location_id)
);

CREATE INDEX idx_lc_from ON location_connections (from_location_id);
CREATE INDEX idx_lc_to ON location_connections (to_location_id);
CREATE INDEX idx_lc_case ON location_connections (case_id);

COMMENT ON TABLE location_connections IS 'Переходы между локациями';
COMMENT ON COLUMN location_connections.from_location_id IS 'Откуда';
COMMENT ON COLUMN location_connections.to_location_id IS 'Куда';
COMMENT ON COLUMN location_connections.label IS 'Подпись: «Выйти на улицу»';
COMMENT ON COLUMN location_connections.sort_order IS 'Порядок отображения';