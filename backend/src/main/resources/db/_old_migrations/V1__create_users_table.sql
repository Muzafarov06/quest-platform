-- =====================================================================
-- V1: Таблица пользователей.
-- Пользователи платформы. Регистрация только для владельцев кейсов;
-- гости играют без аккаунта (см. session_players в будущих миграциях).
-- =====================================================================

CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(50)  NOT NULL,
    avatar_key      VARCHAR(50)  NOT NULL DEFAULT 'default',

    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'BLOCKED', 'DELETED'))
);

-- Индекс по status: полезен для админ-фильтров "показать активных".
CREATE INDEX idx_users_status ON users (status);

-- Комментарии к таблице и колонкам (PostgreSQL-специфично, помогает в psql).
COMMENT ON TABLE users IS 'Пользователи платформы';
COMMENT ON COLUMN users.email IS 'Email, используется как логин';
COMMENT ON COLUMN users.password_hash IS 'BCrypt-хеш пароля. Никогда не хранить пароль в открытом виде';
COMMENT ON COLUMN users.display_name IS 'Отображаемое имя в комнатах';
COMMENT ON COLUMN users.avatar_key IS 'Ключ предустановленного аватара';
COMMENT ON COLUMN users.status IS 'ACTIVE | BLOCKED | DELETED';
COMMENT ON COLUMN users.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN users.last_login_at IS 'UTC, обновляется при успешном логине';