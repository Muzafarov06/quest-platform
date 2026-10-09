-- =====================================================================
-- V2: Таблица кейсов (квестов).
--
-- Кейс — это описание расследования: метаданные + контент.
-- Пока в таблице только метаданные. Контент (локации, улики, события)
-- появится в отдельных таблицах отдельными миграциями.
-- =====================================================================

CREATE TABLE cases (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    code            VARCHAR(30)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,

    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',

    created_by      UUID         NOT NULL,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT cases_code_unique UNIQUE (code),
    CONSTRAINT cases_status_check CHECK (status IN ('DRAFT', 'TESTING', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT cases_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Индекс по status: полезен для "показать только PUBLISHED".
CREATE INDEX idx_cases_status ON cases (status);

-- Индекс по created_by: полезен для "мои кейсы" у автора.
CREATE INDEX idx_cases_created_by ON cases (created_by);

COMMENT ON TABLE cases IS 'Кейсы (квесты) платформы';
COMMENT ON COLUMN cases.code IS 'Публичный идентификатор, например CASE-001';
COMMENT ON COLUMN cases.title IS 'Отображаемое название кейса';
COMMENT ON COLUMN cases.description IS 'Краткое описание для каталога';
COMMENT ON COLUMN cases.status IS 'DRAFT | TESTING | PUBLISHED | ARCHIVED';
COMMENT ON COLUMN cases.created_by IS 'Автор кейса (users.id)';
COMMENT ON COLUMN cases.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN cases.updated_at IS 'UTC, обновляется при изменении';