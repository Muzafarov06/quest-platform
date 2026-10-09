# Модель контента и движок

## Философия

Квест — это **граф типизированных узлов** + **правила** (условия и эффекты),
которые реагируют на действия игроков и меняют состояние сессии.

Движок **не знает**, что такое «дом», «поезд» или «телефон». Он знает:
- узел имеет `type` и `data` (JSONB);
- узлы связаны рёбрами;
- есть условия, которые проверяются против состояния;
- есть эффекты, которые меняют состояние;
- есть события, которые срабатывают на триггеры.

Рендер узла — задача фронтенда. Новый `type` = новый React-компонент + новые
данные. Java-код движка не меняется.

## Сущности

### cases — метаданные кейса

id, code, title, description, genre, age_limit, min_players, max_players,
duration_minutes, price_cents, cover_media_id, status (DRAFT/TESTING/PUBLISHED/ARCHIVED),
current_version_id, created_by, created_at, updated_at.

### case_versions — иммутабельный снапшот

id, case_id, version_number, published_at, published_by, notes.
UNIQUE (case_id, version_number).

Сессия ссылается на `case_version_id`, а не на `case_id`. Правка кейса не ломает
активные сессии.

### case_nodes — узлы контента

id, version_id, type, title, description, data (JSONB), media_id, parent_id,
sort_order, created_at.

Типы:
- `LOCATION`
- `GAME_OBJECT`
- `CHARACTER`
- `EVIDENCE`
- `PUZZLE`
- `DOCUMENT`
- `MEDIA`
- `NOTE`
- `FINAL_QUESTION`

Почему JSONB: типов много, добавление нового не требует миграции БД и Java-класса.
Общие поля — колонки, специфичные — JSONB. GIN-индекс при необходимости.

### case_edges — связи между узлами

id, version_id, from_node_id, to_node_id, type, data (JSONB), sort_order.

Типы рёбер: `CONNECTS_TO`, `CONTAINS`, `REVEALS`, `REQUIRES`, `UNLOCKS`.

### case_conditions — условия

id, version_id, target_type (NODE/EDGE/EVENT), target_id, type, params (JSONB),
logic_group, negate.

Типы условий: `EVIDENCE_DISCOVERED`, `PUZZLE_SOLVED`, `LOCATION_VISITED`,
`PLAYER_COUNT`, `VARIABLE_EQUALS`, `ITEM_IN_INVENTORY`.

Проверяются против состояния сессии.

### case_events — события

id, version_id, trigger_type, trigger_params (JSONB), once, priority, title.

Триггеры: `ON_EVIDENCE`, `ON_PUZZLE_SOLVED`, `ON_LOCATION_VISIT`,
`ON_OBJECT_INTERACT`, `ON_MANUAL`, `ON_TIMER`.

### case_effects — эффекты

id, event_id, type, target_id, params (JSONB), sort_order.

Типы: `UNLOCK_LOCATION`, `REVEAL_EVIDENCE`, `CHANGE_OBJECT_STATE`,
`SHOW_MESSAGE`, `TRIGGER_EVENT`, `UNLOCK_FINAL`, `PLAY_SOUND`.

### case_media — медиа (метаданные)

id, version_id, s3_key, mime_type, size_bytes, original_name, width, height,
uploaded_by, created_at.

Файлы — в S3. PostgreSQL хранит только метаданные.

## JSONB-схемы по типам узлов

### LOCATION

```json
{
  "locationType": "HOUSE | ROOM | STREET | FOREST | VEHICLE | DIGITAL | ...",
  "vehicleType": "CAMPER | CAR | TRAIN | SHIP | PLANE",
  "backgroundMediaId": "uuid",
  "ambientSoundId": "uuid",
  "isStartLocation": true,
  "mapPosition": { "x": 120, "y": 340 },
  "mapIconKey": "house",
  "timeOfDay": "NIGHT | DAY | EVENING",
  "entryMessage": "Вы входите в дом...",
  "darkness": true
}
```

### GAME_OBJECT

```json
{
  "objectType": "DOOR | PHONE | COMPUTER | SAFE | CONTAINER | ITEM | SWITCH",
  "state": "CLOSED | OPEN | LOCKED | BROKEN",
  "requiredItemNodeId": "uuid",
  "requiredPuzzleNodeId": "uuid",
  "position": { "x": 0.45, "y": 0.62 },
  "size": { "w": 0.1, "h": 0.15 },
  "zIndex": 5,
  "hoverText": "Открыть дверь",
  "lockedMessage": "Дверь заперта."
}
```

### CHARACTER

```json
{
  "fullName": "Андрей Соколов",
  "role": "SUSPECT | WITNESS | VICTIM | FAMILY | POLICE",
  "portraitMediaId": "uuid",
  "locationNodeId": "uuid",
  "biography": "...",
  "publicFacts": ["..."],
  "hiddenFacts": [
    { "fact": "...", "condition": { "type": "EVIDENCE_DISCOVERED", "params": { "id": "uuid" } } }
  ],
  "dialogueNodeIds": ["uuid"],
  "aiEnabled": false
}
```

### EVIDENCE

```json
{
  "evidenceType": "DOCUMENT | PHOTO | AUDIO | VIDEO | PHYSICAL | DIGITAL | TESTIMONY",
  "category": "FORENSIC | WITNESS | DIGITAL | PHYSICAL",
  "importance": "KEY | SUPPORTING | RED_HERRING",
  "contentMediaId": "uuid",
  "contentText": "...",
  "discoveryCondition": { "type": "LOCATION_VISITED", "params": { "locationId": "uuid" } },
  "autoDiscover": false,
  "discoveryMessage": "Вы нашли окровавленный нож.",
  "tags": ["оружие", "кровь"]
}
```

### PUZZLE

```json
{
  "puzzleType": "CODE | PASSWORD | LOGIC | MATCHING | SEQUENCE | CIPHER | COORDINATES | FREE_TEXT",
  "question": "Введите код с сейфа",
  "solution": { "answer": "4821", "caseSensitive": false },
  "hints": [{ "text": "...", "condition": {} }],
  "maxAttempts": 5,
  "onSuccessEffectIds": ["uuid"]
}
```

### DOCUMENT

```json
{
  "documentType": "LETTER | REPORT | DIARY | NEWSPAPER | CONTRACT | NOTE",
  "pages": [{ "text": "Страница 1...", "mediaId": "uuid" }],
  "canBeAddedToBoard": true
}
```

### MEDIA

```json
{
  "mediaType": "IMAGE | AUDIO | VIDEO",
  "mediaId": "uuid",
  "caption": "...",
  "autoplay": false,
  "transcript": "..."
}
```

### FINAL_QUESTION

```json
{
  "questionText": "Кто совершил преступление?",
  "answerType": "SINGLE_CHOICE | MULTIPLE_CHOICE | FREE_TEXT | CHARACTER_SELECT",
  "options": [{ "id": "uuid", "text": "...", "isCorrect": true }],
  "explanationText": "...",
  "revealEvidenceIds": ["uuid"]
}
```

## Цикл исполнения действия

```
1. Action приходит в EngineService
2. Валидация: доступно ли действие в текущем состоянии?
3. Применение: изменение состояния сессии
4. Сбор сработавших событий
5. Для каждого события:
   - проверка conditions против нового состояния
   - если true — применить effects
6. Effects могут породить новые события (цепочка ограничена глубиной)
7. Сохранить состояние в БД (транзакция)
8. Отправить WebSocket-событие всем игрокам
```

## Расширяемость движка

```java
interface ConditionEvaluator { ConditionType getType(); boolean evaluate(...); }
interface EffectApplier      { EffectType getType();    void apply(...); }
interface ActionHandler      { ActionType getType();    void handle(...); }
```

Spring собирает реализации в `Map<Type, Handler>`. Новый тип = новый `@Component`,
старые не меняются.

## Иммутабельность

Публикация кейса создаёт `case_version` со снапшотом всех узлов.
Активные сессии ссылаются на старые версии. Новые — на новую.
Правка = новая DRAFT-версия → Publish → version=N+1.

## Как один движок поддерживает все жанры

| Жанр | Что использует |
|---|---|
| Городское расследование | LOCATION, GAME_OBJECT, EVIDENCE |
| Хоррор в квартире | LOCATION, EVENT, MEDIA (audio) |
| Лес | LOCATION, EVIDENCE, PUZZLE (coords) |
| Бункер | LOCATION, GAME_OBJECT (terminal), PUZZLE (code) |
| Поезд | LOCATION (wagon), EDGE (CONNECTS_TO), CHARACTER |
| Цифровое расследование | LOCATION (website/phone), GAME_OBJECT, EVIDENCE |

Java-код движка не меняется.