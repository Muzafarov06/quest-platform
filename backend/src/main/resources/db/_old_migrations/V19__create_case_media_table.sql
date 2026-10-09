-- =====================================================================
-- V19: Медиа-файлы кейсов.
--
-- Метаданные файлов. Сами файлы — в S3-хранилище (SeaweedFS/Yandex).
-- В БД только: id, s3_key, mime, размер, кто загрузил, к какому кейсу.
-- =====================================================================

CREATE TABLE case_media (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    case_id         UUID         NOT NULL,

    s3_key          VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    size_bytes      BIGINT       NOT NULL,
    original_name   VARCHAR(255),

    width           INT,
    height          INT,

    uploaded_by     UUID         NOT NULL,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT cm_case_fk FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT cm_user_fk FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT cm_s3_key_unique UNIQUE (s3_key)
);

CREATE INDEX idx_cm_case ON case_media (case_id);
CREATE INDEX idx_cm_uploader ON case_media (uploaded_by);

COMMENT ON TABLE case_media IS 'Метаданные медиа-файлов кейсов';
COMMENT ON COLUMN case_media.s3_key IS 'Путь в S3-хранилище: cases/{caseId}/{uuid}.{ext}';
COMMENT ON COLUMN case_media.mime_type IS 'image/png, audio/mpeg, ...';
COMMENT ON COLUMN case_media.size_bytes IS 'Размер файла в байтах';
COMMENT ON COLUMN case_media.original_name IS 'Оригинальное имя (для UI)';
COMMENT ON COLUMN case_media.width IS 'Ширина изображения (если применимо)';
COMMENT ON COLUMN case_media.height IS 'Высота изображения (если применимо)';