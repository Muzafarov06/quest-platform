-- =====================================================================
-- V21: Система ролей.
--
-- До этой миграции ролей не было: каждый пользователь неявно был ROLE_USER
-- (жёстко в JwtAuthenticationFilter). Теперь роли — в БД.
--
-- user_roles: M2M users ↔ roles. Один юзер может иметь несколько ролей.
-- roles.code — единый идентификатор роли (USER, ADMIN, ...).
--
-- Иерархия ролей (ADMIN > USER) настраивается в Java (RoleHierarchyConfig),
-- не в БД — потому что это правило доступа, а не данные.
-- =====================================================================

CREATE TABLE roles (
    id    SMALLINT     PRIMARY KEY,
    code  VARCHAR(30)  NOT NULL UNIQUE,
    name  VARCHAR(100) NOT NULL
);

COMMENT ON TABLE roles IS 'Роли пользователей';
COMMENT ON COLUMN roles.code IS 'Машиночитаемый идентификатор: USER, ADMIN, AUTHOR, TESTER';

INSERT INTO roles (id, code, name) VALUES
    (1, 'USER',   'Пользователь'),
    (2, 'ADMIN',  'Администратор');

CREATE TABLE user_roles (
    user_id UUID     NOT NULL,
    role_id SMALLINT NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT ur_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ur_role_fk FOREIGN KEY (role_id)
        REFERENCES roles (id) ON DELETE RESTRICT
);

COMMENT ON TABLE user_roles IS 'Связь пользователей и ролей (M2M)';

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_role ON user_roles (role_id);

-- Выдать всем существующим пользователям роль USER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'USER';

-- Выдать первому (самому старому) пользователю роль ADMIN.
-- Это "я" на момент V21. Если нужно другому — отдельная миграция V22.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'ADMIN'
  AND u.id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
ON CONFLICT DO NOTHING;