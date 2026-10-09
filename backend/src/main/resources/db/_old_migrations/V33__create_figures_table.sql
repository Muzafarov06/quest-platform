-- =====================================================================
-- V33: Фигурки-персонажи для лобби.
--
-- Раньше список фигурок был захардкожен в Java и TypeScript.
-- Теперь это контент в БД: админ загружает PNG через админку,
-- задаёт название и эмодзи-fallback.
--
-- case_media.case_id становится nullable — фигурки не привязаны к кейсу,
-- это глобальный контент платформы.
-- =====================================================================

-- 1. Разрешаем case_id = NULL в case_media
ALTER TABLE case_media ALTER COLUMN case_id DROP NOT NULL;

-- 2. Таблица фигурок
CREATE TABLE figures (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30)  NOT NULL UNIQUE,
    label           VARCHAR(100) NOT NULL,
    fallback_emoji  VARCHAR(10)  NOT NULL DEFAULT '🕵️',
    media_id        UUID         NULL,
    sort_order      INT          NOT NULL DEFAULT 0,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT figures_media_fk FOREIGN KEY (media_id)
        REFERENCES case_media (id) ON DELETE SET NULL
);

CREATE INDEX idx_figures_active ON figures (active, sort_order, created_at);

COMMENT ON TABLE figures IS 'Фигурки-персонажи для лобби';
COMMENT ON COLUMN figures.code IS 'Служебный код: figure-001, figure-002, ...';
COMMENT ON COLUMN figures.label IS 'Название для UI: «Сыщик», «Аналитик»';
COMMENT ON COLUMN figures.fallback_emoji IS 'Эмодзи, если PNG не загружен';
COMMENT ON COLUMN figures.media_id IS 'PNG в S3. NULL — только эмодзи.';
COMMENT ON COLUMN figures.active IS 'Мягкое удаление: false = скрыта из UI';