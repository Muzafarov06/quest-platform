# Схема базы данных (PostgreSQL)

## Принципы

1. **Контент ≠ Прогресс.** `case_*` — квест. `session_*` — прохождение.
2. **Контент иммутабелен после публикации.** Правка = новая версия.
3. **Все ID — UUID.** Не угадываются, безопасны в URL.
4. **Время — TIMESTAMPTZ (UTC).** Никаких LocalDateTime без таймзоны в БД.

## Группа: Пользователи и роли

### users

id, email (UNIQUE), password_hash, display_name, avatar_key,
status (ACTIVE/BLOCKED/DELETED), created_at, last_login_at, deleted_at.

`avatar_key` — пресет (не загружается). `deleted_at` — мягкое удаление.

### roles

id, code, name.
Сиды: `USER`, `ADMIN`, `AUTHOR`, `TESTER`.

### user_roles (M2M)

user_id, role_id. PK: (user_id, role_id). CASCADE от users.

## Группа: Кейсы

### cases

id, code (UNIQUE), title, description, genre, age_limit, min_players,
max_players, duration_minutes, price_cents, cover_media_id, status,
current_version_id, created_by, created_at, updated_at, deleted_at.

CHECK (min_players >= 1 AND max_players >= min_players).

### case_versions

id, case_id (FK, CASCADE), version_number, published_at, published_by, notes.
UNIQUE (case_id, version_number).

### case_nodes

id, version_id (FK, CASCADE), type, title, description, data (JSONB, DEFAULT '{}'),
media_id, parent_id (FK RESTRICT), sort_order, created_at.

Индексы: (version_id, type), (version_id, parent_id), GIN(data).

### case_edges

id, version_id, from_node_id, to_node_id, type, data (JSONB), sort_order.
UNIQUE (version_id, from_node_id, to_node_id, type).
CASCADE от case_nodes.

### case_conditions

id, version_id, target_type, target_id, type, params (JSONB), logic_group, negate.
Полиморфная ссылка (target может быть узлом, ребром, событием).

### case_events

id, version_id, trigger_type, trigger_params (JSONB), once, priority, title.

### case_effects

id, event_id (FK, CASCADE), type, target_id, params (JSONB), sort_order.

### case_media

id, version_id (FK), s3_key, mime_type, size_bytes, original_name,
width, height, uploaded_by, created_at.

Файлы в S3. В БД — только метаданные.

## Группа: Игровые сессии

### game_sessions

id, case_id, case_version_id, owner_user_id, room_code (UNIQUE),
status (LOBBY/ACTIVE/FINISHED/ABANDONED), state_version, settings (JSONB),
created_at, started_at, finished_at, expires_at.

`case_version_id` — снапшот контента. `state_version` — оптимистичная блокировка.

### session_players

id, session_id (FK, CASCADE), user_id (NULL FK — у гостей NULL),
guest_token (UNIQUE NULL), display_name, avatar_key,
role (PLAYER/SPECTATOR), joined_at, last_seen_at, is_active.

UNIQUE (session_id, user_id) — где user_id не NULL.

## Группа: Состояние сессии

Все с session_id FK CASCADE, UNIQUE (session_id, node_id):

- `session_discovered_evidence` — evidence_node_id, discovered_by, discovered_at
- `session_visited_locations` — location_node_id, visited_by, visited_at
- `session_solved_puzzles` — puzzle_node_id, solved_by, answer_text, solved_at
- `session_object_states` — object_node_id, state (JSONB), updated_at
- `session_triggered_events` — event_id, triggered_at
- `session_variables` — key, value (JSONB), updated_at
- `session_final_answers` — question_node_id, answer_text, is_correct,
  submitted_by, submitted_at

## Группа: Доска, заметки, чат

### board_items

id, session_id, type, title, content, node_ref_id, x, y, created_by, created_at.

### board_connections

id, session_id, from_item_id, to_item_id, label.

### session_notes

id, session_id, author_id, text, created_at.

### chat_messages

id, session_id, author_id, text, created_at.
Индекс: (session_id, created_at DESC).

## Группа: Платежи и доступ

### payments

id, user_id, case_id, provider (YOOKASSA/STRIPE/MOCK),
provider_payment_id (UNIQUE NULL), amount_cents, currency (DEFAULT 'RUB'),
status (PENDING/SUCCEEDED/FAILED/REFUNDED), created_at, paid_at.

### entitlements

id, user_id, case_id, payment_id (NULL), status (ACTIVE/EXPIRED/REVOKED),
max_sessions (DEFAULT 1), max_active_sessions (DEFAULT 1),
sessions_created (DEFAULT 0), expires_at, created_at.

`sessions_created` — счётчик для атомарной проверки лимита.

## Группа: Голос

### voice_rooms

id, session_id (UNIQUE), provider, room_name, created_at.

## Каскады: сводка

| Связь | Каскад | Почему |
|---|---|---|
| case_versions → cases | CASCADE | версия без кейса не нужна |
| case_nodes → case_versions | CASCADE | узел без версии не нужен |
| case_nodes.parent_id → case_nodes | RESTRICT | запрет удалять родителя с детьми |
| case_edges → case_nodes | CASCADE | ребро без узлов не нужно |
| case_effects → case_events | CASCADE | эффект без события не нужен |
| game_sessions → cases, case_versions | RESTRICT | нельзя удалить кейс с сессиями |
| session_* → game_sessions | CASCADE | прогресс без сессии не нужен |
| session_players → users | CASCADE | удалённый юзер уходит из сессий |
| payments → users, cases | RESTRICT | финансовые данные не удаляются каскадом |
| entitlements → users, cases | RESTRICT | доступ не должен исчезать |

## Ключевые индексы

| Таблица | Индекс | Зачем |
|---|---|---|
| users | UNIQUE(email) | логин |
| cases | UNIQUE(code) | публичный ID |
| cases | (status, genre) | каталог |
| case_nodes | (version_id, type) | выборка узлов по типу |
| case_nodes | GIN(data) | поиск по JSONB |
| case_edges | (version_id, from_node_id) | исходящие |
| case_edges | (version_id, to_node_id) | входящие |
| game_sessions | UNIQUE(room_code) | invite |
| game_sessions | (status, expires_at) | cron-очистка |
| session_players | UNIQUE(session_id, user_id) | не дважды в комнате |
| session_discovered_evidence | UNIQUE(session_id, evidence_node_id) | идемпотентность |
| session_visited_locations | UNIQUE(session_id, location_node_id) | идемпотентность |
| session_solved_puzzles | UNIQUE(session_id, puzzle_node_id) | идемпотентность |
| chat_messages | (session_id, created_at DESC) | пагинация |
| entitlements | (user_id, case_id, status) | проверка доступа |
| payments | (provider, provider_payment_id) | идемпотентность вебхуков |

## Медиа: где что лежит

| Сущность | Где медиа |
|---|---|
| Обложка кейса | `cases.cover_media_id` |
| Фон локации | `case_nodes.data.backgroundMediaId` (type=LOCATION) |
| Спрайт объекта | `case_nodes.data.mediaId` (type=GAME_OBJECT) |
| Портрет персонажа | `case_nodes.data.portraitMediaId` (type=CHARACTER) |
| Контент улики | `case_nodes.data.contentMediaId` (type=EVIDENCE) |
| Страницы документа | `case_nodes.data.pages[].mediaId` (type=DOCUMENT) |
| Аудио/видео | `case_nodes.data.mediaId` (type=MEDIA) |

Правило: в `data` — `case_media.id` (UUID), не `s3_key`.
Фронт запрашивает `GET /api/media/{id}` → Spring проверяет права → presigned URL.

## Транзакции

- **Action игрока** — одна транзакция: применить action, обновить состояние,
  зафиксировать события. Падение → откат всего.
- **Создание сессии** — одна транзакция: проверка entitlement + INSERT session +
  INSERT owner player + инкремент sessions_created.
- **Webhook оплаты** — одна транзакция: обновить payment, создать entitlement.

## Время

- В БД — TIMESTAMPTZ (UTC).
- Java: `Instant` для моментов, `LocalDate` для дат, `LocalDateTime` — только
  для «наивных» дат в контенте.
- API: ISO-8601 с `Z`.
- Фронт: отображает в локальной таймзоне.

## Что НЕ делаем

- base64 в БД. Только `media_id`.
- Одну JSON-колонку для состояния сессии. Только отдельные таблицы.
- EAV. Узлы — JSONB, не `node_attributes`.
- `deleted_at` везде. Только `users`, `cases`.
- Audit-таблицы на MVP.