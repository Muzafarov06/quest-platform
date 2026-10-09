-- =====================================================================
-- V22: Расширение метаданных кейса.
--
-- До этой миграции в cases были только code/title/description/status.
-- Для админки и каталога нужны: жанр, возрастное ограничение,
-- количество игроков, время, цена, обложка.
--
-- Все новые поля получают разумные DEFAULT, чтобы существующие кейсы
-- (CASE-001) не пострадали.
--
-- cover_media_id ссылается на case_media (V19). ON DELETE SET NULL:
-- удалили медиа — кейс остался, но без обложки.
-- =====================================================================

ALTER TABLE cases
    ADD COLUMN genre            VARCHAR(30) NOT NULL DEFAULT 'DETECTIVE',
    ADD COLUMN age_limit        SMALLINT    NOT NULL DEFAULT 16,
    ADD COLUMN min_players      SMALLINT    NOT NULL DEFAULT 1,
    ADD COLUMN max_players      SMALLINT    NOT NULL DEFAULT 10,
    ADD COLUMN duration_minutes INT,
    ADD COLUMN price_cents      INT         NOT NULL DEFAULT 0,
    ADD COLUMN cover_media_id   UUID;

ALTER TABLE cases
    ADD CONSTRAINT cases_cover_media_fk
        FOREIGN KEY (cover_media_id) REFERENCES case_media (id) ON DELETE SET NULL;

-- Инвариант: игроков должно быть от 1, и max >= min.
-- Проверка на уровне БД — последняя линия обороны, если валидация в Java пропустит.
ALTER TABLE cases
    ADD CONSTRAINT cases_players_check
        CHECK (min_players >= 1 AND max_players >= min_players);

-- IF NOT EXISTS: idx_cases_status уже создан в V2__create_cases_table.
-- Без IF NOT EXISTS Flyway падает на повторном CREATE INDEX.
-- Такая идемпотентность безопасна: если индекс есть — пропускаем,
-- если нет (например, на чистой БД) — создаём.
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_genre  ON cases (genre);

COMMENT ON COLUMN cases.genre IS 'Жанр: DETECTIVE, HORROR, MYSTERY, SCI_FI, ...';
COMMENT ON COLUMN cases.age_limit IS 'Минимальный возраст игрока';
COMMENT ON COLUMN cases.min_players IS 'Минимум игроков в сессии';
COMMENT ON COLUMN cases.max_players IS 'Максимум игроков в сессии';
COMMENT ON COLUMN cases.duration_minutes IS 'Примерное время прохождения (может быть NULL)';
COMMENT ON COLUMN cases.price_cents IS 'Цена в копейках. 0 = бесплатно';
COMMENT ON COLUMN cases.cover_media_id IS 'Обложка кейса (FK на case_media)';