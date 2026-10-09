--
-- V1: Схема базы данных Quest Platform.
-- Все таблицы, индексы, constraints и комментарии.
-- Применяется Flyway при первом запуске на пустой БД.
--

-- ============================================================
-- ТАБЛИЦЫ
-- ============================================================

CREATE TABLE public.board_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    from_item_id uuid NOT NULL,
    to_item_id uuid NOT NULL,
    label character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bc_no_self CHECK ((from_item_id <> to_item_id))
);
COMMENT ON TABLE public.board_connections IS 'Связи между карточками на доске';

CREATE TABLE public.board_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    created_by uuid NOT NULL,
    item_type character varying(20) DEFAULT 'NOTE'::character varying NOT NULL,
    title character varying(200),
    content text,
    evidence_id uuid,
    pos_x real DEFAULT 0 NOT NULL,
    pos_y real DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bi_type_check CHECK (((item_type)::text = ANY (ARRAY[('EVIDENCE'::character varying)::text, ('NOTE'::character varying)::text, ('HYPOTHESIS'::character varying)::text, ('QUESTION'::character varying)::text])))
);
COMMENT ON TABLE public.board_items IS 'Карточки на доске расследования';
COMMENT ON COLUMN public.board_items.item_type IS 'EVIDENCE, NOTE, HYPOTHESIS, QUESTION';
COMMENT ON COLUMN public.board_items.evidence_id IS 'Если тип EVIDENCE — ссылка на улику';

CREATE TABLE public.case_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid,
    s3_key character varying(500) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size_bytes bigint NOT NULL,
    original_name character varying(255),
    width integer,
    height integer,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.case_media IS 'Метаданные медиа-файлов кейсов';
COMMENT ON COLUMN public.case_media.s3_key IS 'Путь в S3-хранилище: cases/{caseId}/{uuid}.{ext}';
COMMENT ON COLUMN public.case_media.mime_type IS 'image/png, audio/mpeg, ...';
COMMENT ON COLUMN public.case_media.size_bytes IS 'Размер файла в байтах';
COMMENT ON COLUMN public.case_media.original_name IS 'Оригинальное имя (для UI)';
COMMENT ON COLUMN public.case_media.width IS 'Ширина изображения (если применимо)';
COMMENT ON COLUMN public.case_media.height IS 'Высота изображения (если применимо)';

CREATE TABLE public.cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(30) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    genre character varying(30) DEFAULT 'DETECTIVE'::character varying NOT NULL,
    age_limit smallint DEFAULT 16 NOT NULL,
    min_players smallint DEFAULT 1 NOT NULL,
    max_players smallint DEFAULT 10 NOT NULL,
    duration_minutes integer,
    price_cents integer DEFAULT 0 NOT NULL,
    cover_media_id uuid,
    map_media_id uuid,
    entry_location_id uuid,
    map_width integer DEFAULT 2400 NOT NULL,
    map_height integer DEFAULT 1600 NOT NULL,
    CONSTRAINT cases_players_check CHECK (((min_players >= 1) AND (max_players >= min_players))),
    CONSTRAINT cases_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('TESTING'::character varying)::text, ('PUBLISHED'::character varying)::text, ('ARCHIVED'::character varying)::text])))
);
COMMENT ON TABLE public.cases IS 'Кейсы (квесты) платформы';
COMMENT ON COLUMN public.cases.code IS 'Публичный идентификатор, например CASE-001';
COMMENT ON COLUMN public.cases.title IS 'Отображаемое название кейса';
COMMENT ON COLUMN public.cases.description IS 'Краткое описание для каталога';
COMMENT ON COLUMN public.cases.status IS 'DRAFT | TESTING | PUBLISHED | ARCHIVED';
COMMENT ON COLUMN public.cases.created_by IS 'Автор кейса (users.id)';
COMMENT ON COLUMN public.cases.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.cases.updated_at IS 'UTC, обновляется при изменении';
COMMENT ON COLUMN public.cases.genre IS 'Жанр: DETECTIVE, HORROR, MYSTERY, SCI_FI, ...';
COMMENT ON COLUMN public.cases.age_limit IS 'Минимальный возраст игрока';
COMMENT ON COLUMN public.cases.min_players IS 'Минимум игроков в сессии';
COMMENT ON COLUMN public.cases.max_players IS 'Максимум игроков в сессии';
COMMENT ON COLUMN public.cases.duration_minutes IS 'Примерное время прохождения (может быть NULL)';
COMMENT ON COLUMN public.cases.price_cents IS 'Цена в копейках. 0 = бесплатно';
COMMENT ON COLUMN public.cases.cover_media_id IS 'Обложка кейса (FK на case_media)';
COMMENT ON COLUMN public.cases.map_media_id IS 'Фон карты местности (PNG-схема города/леса и т.д.)';
COMMENT ON COLUMN public.cases.entry_location_id IS 'Стартовая локация: где появляется игрок при старте сессии';
COMMENT ON COLUMN public.cases.map_width IS 'Ширина полотна карты дела (px)';
COMMENT ON COLUMN public.cases.map_height IS 'Высота полотна карты дела (px)';

CREATE TABLE public.character_dialogs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    requires_evidence_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.characters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    location_id uuid,
    name character varying(200) NOT NULL,
    description text,
    biography text,
    portrait_media_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pos_x real DEFAULT 50 NOT NULL,
    pos_y real DEFAULT 50 NOT NULL,
    scene_scale real DEFAULT 1.0 NOT NULL,
    scene_rotation real DEFAULT 0.0 NOT NULL,
    dialogue_media_id uuid,
    unlock_mode character varying(30) DEFAULT 'AUTO'::character varying NOT NULL,
    unlock_target_id uuid,
    CONSTRAINT characters_unlock_mode_check CHECK (((unlock_mode)::text = ANY (ARRAY[('AUTO'::character varying)::text, ('ALWAYS'::character varying)::text, ('LOCATION_OPENED'::character varying)::text, ('EVIDENCE_FOUND'::character varying)::text])))
);
COMMENT ON TABLE public.characters IS 'Персонажи кейса';
COMMENT ON COLUMN public.characters.biography IS 'Скрытая предыстория (только для админа)';
COMMENT ON COLUMN public.characters.pos_x IS 'X персонажа на сцене локации (0–100%%)';
COMMENT ON COLUMN public.characters.pos_y IS 'Y персонажа на сцене локации (0–100%%)';
COMMENT ON COLUMN public.characters.scene_scale IS 'Множитель размера на сцене (0.1–10.0)';
COMMENT ON COLUMN public.characters.scene_rotation IS 'Угол поворота, градусы (-180–180)';
COMMENT ON COLUMN public.characters.dialogue_media_id IS 'Большая фотография для окна диалога. NULL — используется portrait_media_id.';
COMMENT ON COLUMN public.characters.unlock_mode IS 'AUTO | ALWAYS | LOCATION_OPENED | EVIDENCE_FOUND';
COMMENT ON COLUMN public.characters.unlock_target_id IS 'UUID локации или улики, к которой привязано открытие';

CREATE TABLE public.evidences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    object_id uuid,
    location_id uuid,
    title character varying(200) NOT NULL,
    description text,
    content_text text,
    evidence_type character varying(30) DEFAULT 'DOCUMENT'::character varying NOT NULL,
    importance character varying(20) DEFAULT 'SUPPORTING'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_id uuid,
    CONSTRAINT evidences_importance_check CHECK (((importance)::text = ANY (ARRAY[('KEY'::character varying)::text, ('SUPPORTING'::character varying)::text, ('RED_HERRING'::character varying)::text]))),
    CONSTRAINT evidences_type_check CHECK (((evidence_type)::text = ANY (ARRAY[('DOCUMENT'::character varying)::text, ('PHOTO'::character varying)::text, ('AUDIO'::character varying)::text, ('VIDEO'::character varying)::text, ('PHYSICAL'::character varying)::text, ('DIGITAL'::character varying)::text, ('TESTIMONY'::character varying)::text, ('OTHER'::character varying)::text])))
);
COMMENT ON TABLE public.evidences IS 'Улики внутри кейса';
COMMENT ON COLUMN public.evidences.case_id IS 'Кейс, которому принадлежит улика';
COMMENT ON COLUMN public.evidences.object_id IS 'Объект, через который находится улика (опционально)';
COMMENT ON COLUMN public.evidences.location_id IS 'Локация улики (опционально)';
COMMENT ON COLUMN public.evidences.title IS 'Название: «SMS от Андрея»';
COMMENT ON COLUMN public.evidences.description IS 'Краткое описание';
COMMENT ON COLUMN public.evidences.content_text IS 'Содержимое улики: текст письма, показания';
COMMENT ON COLUMN public.evidences.evidence_type IS 'DOCUMENT, PHOTO, AUDIO, VIDEO, PHYSICAL, DIGITAL, TESTIMONY, OTHER';
COMMENT ON COLUMN public.evidences.importance IS 'KEY, SUPPORTING, RED_HERRING';
COMMENT ON COLUMN public.evidences.sort_order IS 'Порядок отображения';
COMMENT ON COLUMN public.evidences.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.evidences.updated_at IS 'UTC, обновляется при изменении';
COMMENT ON COLUMN public.evidences.media_id IS 'Изображение улики (PNG, JPG)';

CREATE TABLE public.figures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(30) NOT NULL,
    label character varying(100) NOT NULL,
    fallback_emoji character varying(10) DEFAULT '🕵️'::character varying NOT NULL,
    media_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.figures IS 'Фигурки-персонажи для лобби';
COMMENT ON COLUMN public.figures.code IS 'Служебный код: figure-001, figure-002, ...';
COMMENT ON COLUMN public.figures.label IS 'Название для UI: «Сыщик», «Аналитик»';
COMMENT ON COLUMN public.figures.fallback_emoji IS 'Эмодзи, если PNG не загружен';
COMMENT ON COLUMN public.figures.media_id IS 'PNG в S3. NULL — только эмодзи.';
COMMENT ON COLUMN public.figures.active IS 'Мягкое удаление: false = скрыта из UI';

CREATE TABLE public.final_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    question_text text NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    correct_option_id character varying(100) NOT NULL,
    explanation_text text,
    reveal_evidence_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.final_questions IS 'Финальные вопросы кейса (по одному на кейс)';
COMMENT ON COLUMN public.final_questions.options IS 'JSONB: [{id, text}, ...]';
COMMENT ON COLUMN public.final_questions.reveal_evidence_ids IS 'JSONB: список UUID улик для раскрытия';

CREATE TABLE public.game_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    condition_type character varying(30) NOT NULL,
    target_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gc_type_check CHECK (((condition_type)::text = ANY (ARRAY[('OBJECT_INTERACTED'::character varying)::text, ('LOCATION_VISITED'::character varying)::text, ('EVIDENCE_DISCOVERED'::character varying)::text, ('PUZZLE_SOLVED'::character varying)::text])))
);
COMMENT ON TABLE public.game_conditions IS 'Условия срабатывания событий';
COMMENT ON COLUMN public.game_conditions.condition_type IS 'OBJECT_INTERACTED, LOCATION_VISITED, EVIDENCE_DISCOVERED, PUZZLE_SOLVED';
COMMENT ON COLUMN public.game_conditions.target_id IS 'UUID объекта/локации/улики, к чему привязано условие';

CREATE TABLE public.game_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    condition_id uuid,
    event_type character varying(30) NOT NULL,
    target_id uuid,
    message text,
    once boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ge_type_check CHECK (((event_type)::text = ANY (ARRAY[('SHOW_MESSAGE'::character varying)::text, ('REVEAL_EVIDENCE'::character varying)::text, ('UNLOCK_OBJECT'::character varying)::text, ('UNLOCK_LOCATION'::character varying)::text, ('DISPATCH_CALL'::character varying)::text])))
);
COMMENT ON TABLE public.game_events IS 'События, срабатывающие по условиям';
COMMENT ON COLUMN public.game_events.event_type IS 'SHOW_MESSAGE, REVEAL_EVIDENCE, UNLOCK_OBJECT, UNLOCK_LOCATION, DISPATCH_CALL';
COMMENT ON COLUMN public.game_events.target_id IS 'UUID сущности, с которой работает событие';
COMMENT ON COLUMN public.game_events.message IS 'Текст сообщения (для SHOW_MESSAGE)';
COMMENT ON COLUMN public.game_events.once IS 'Сработать только один раз за сессию';

CREATE TABLE public.game_objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    object_type character varying(30) DEFAULT 'ITEM'::character varying NOT NULL,
    state character varying(30) DEFAULT 'CLOSED'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_id uuid,
    pos_x real DEFAULT 50 NOT NULL,
    pos_y real DEFAULT 50 NOT NULL,
    scene_scale real DEFAULT 1.0 NOT NULL,
    scene_rotation real DEFAULT 0.0 NOT NULL,
    render_layer smallint DEFAULT 0 NOT NULL,
    walkable boolean DEFAULT false NOT NULL,
    CONSTRAINT game_objects_render_layer_check CHECK (((render_layer >= '-1'::integer) AND (render_layer <= 1))),
    CONSTRAINT game_objects_state_check CHECK (((state)::text = ANY (ARRAY[('CLOSED'::character varying)::text, ('OPEN'::character varying)::text, ('LOCKED'::character varying)::text, ('BROKEN'::character varying)::text]))),
    CONSTRAINT game_objects_type_check CHECK (((object_type)::text = ANY (ARRAY[('TELEPHONE'::character varying)::text, ('COMPUTER'::character varying)::text, ('DOOR'::character varying)::text, ('SAFE'::character varying)::text, ('CONTAINER'::character varying)::text, ('DOCUMENT'::character varying)::text, ('ITEM'::character varying)::text, ('OTHER'::character varying)::text, ('INTERROGATION_PHONE'::character varying)::text])))
);
COMMENT ON TABLE public.game_objects IS 'Интерактивные объекты внутри локаций';
COMMENT ON COLUMN public.game_objects.location_id IS 'Локация, в которой находится объект';
COMMENT ON COLUMN public.game_objects.name IS 'Название: «Телефон Андрея»';
COMMENT ON COLUMN public.game_objects.description IS 'Описание объекта';
COMMENT ON COLUMN public.game_objects.object_type IS 'TELEPHONE, COMPUTER, DOOR, SAFE, CONTAINER, DOCUMENT, ITEM, OTHER, INTERROGATION_PHONE';
COMMENT ON COLUMN public.game_objects.state IS 'CLOSED, OPEN, LOCKED, BROKEN';
COMMENT ON COLUMN public.game_objects.sort_order IS 'Порядок отображения в локации';
COMMENT ON COLUMN public.game_objects.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.game_objects.updated_at IS 'UTC, обновляется при изменении';
COMMENT ON COLUMN public.game_objects.media_id IS 'Спрайт объекта (PNG)';
COMMENT ON COLUMN public.game_objects.pos_x IS 'X объекта на сцене локации (0-100%%)';
COMMENT ON COLUMN public.game_objects.pos_y IS 'Y объекта на сцене локации (0-100%%)';
COMMENT ON COLUMN public.game_objects.scene_scale IS 'Множитель размера на сцене (0.1–10.0)';
COMMENT ON COLUMN public.game_objects.scene_rotation IS 'Угол поворота, градусы (-180–180)';
COMMENT ON COLUMN public.game_objects.render_layer IS 'Слой отрисовки: -1 под всем, 0 по Y, +1 поверх всего';
COMMENT ON COLUMN public.game_objects.walkable IS 'true — игрок может проходить сквозь объект';

CREATE TABLE public.game_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    room_code character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'LOBBY'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    is_test boolean DEFAULT false NOT NULL,
    CONSTRAINT gs_status_check CHECK (((status)::text = ANY (ARRAY[('LOBBY'::character varying)::text, ('ACTIVE'::character varying)::text, ('FINISHED'::character varying)::text, ('ABANDONED'::character varying)::text])))
);
COMMENT ON TABLE public.game_sessions IS 'Игровые сессии (прохождения кейсов)';
COMMENT ON COLUMN public.game_sessions.case_id IS 'Кейс, который проходят';
COMMENT ON COLUMN public.game_sessions.owner_user_id IS 'Создатель сессии';
COMMENT ON COLUMN public.game_sessions.room_code IS 'Короткий код для приглашения (CASE-8F42KD)';
COMMENT ON COLUMN public.game_sessions.status IS 'LOBBY | ACTIVE | FINISHED | ABANDONED';
COMMENT ON COLUMN public.game_sessions.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.game_sessions.started_at IS 'Когда владелец нажал «Начать»';
COMMENT ON COLUMN public.game_sessions.finished_at IS 'Когда сессия завершена';
COMMENT ON COLUMN public.game_sessions.is_test IS 'Сессия создана в тестовом режиме (админка)';

CREATE TABLE public.location_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    from_location_id uuid NOT NULL,
    to_location_id uuid NOT NULL,
    label character varying(200),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pos_x real,
    pos_y real,
    CONSTRAINT lc_no_self_loop CHECK ((from_location_id <> to_location_id))
);
COMMENT ON TABLE public.location_connections IS 'Переходы между локациями';
COMMENT ON COLUMN public.location_connections.from_location_id IS 'Откуда';
COMMENT ON COLUMN public.location_connections.to_location_id IS 'Куда';
COMMENT ON COLUMN public.location_connections.label IS 'Подпись: «Выйти на улицу»';
COMMENT ON COLUMN public.location_connections.sort_order IS 'Порядок отображения';
COMMENT ON COLUMN public.location_connections.pos_x IS 'X зоны перехода на сцене (0-100%%), NULL = показать списком';
COMMENT ON COLUMN public.location_connections.pos_y IS 'Y зоны перехода на сцене (0-100%%), NULL = показать списком';

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    parent_id uuid,
    name character varying(200) NOT NULL,
    description text,
    location_type character varying(30) DEFAULT 'ROOM'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_id uuid,
    entry_x real DEFAULT 50 NOT NULL,
    entry_y real DEFAULT 85 NOT NULL,
    discovery_mode character varying(20) DEFAULT 'ALWAYS'::character varying NOT NULL,
    discovery_target_id uuid,
    discovery_hint text,
    map_x integer DEFAULT 60 NOT NULL,
    map_y integer DEFAULT 60 NOT NULL,
    scene_scale real DEFAULT 1.0 NOT NULL,
    scene_rotation real DEFAULT 0.0 NOT NULL,
    preview_media_id uuid,
    map_media_id uuid,
    CONSTRAINT locations_discovery_mode_check CHECK (((discovery_mode)::text = ANY (ARRAY[('ALWAYS'::character varying)::text, ('ON_EVIDENCE'::character varying)::text, ('ON_DIALOG'::character varying)::text, ('ON_LOCATION'::character varying)::text, ('ON_MANUAL'::character varying)::text]))),
    CONSTRAINT locations_parent_not_self CHECK ((id <> parent_id)),
    CONSTRAINT locations_type_check CHECK (((location_type)::text = ANY (ARRAY[('HOUSE'::character varying)::text, ('ROOM'::character varying)::text, ('STREET'::character varying)::text, ('FOREST'::character varying)::text, ('VEHICLE'::character varying)::text, ('DIGITAL'::character varying)::text, ('BUILDING'::character varying)::text, ('OTHER'::character varying)::text])))
);
COMMENT ON TABLE public.locations IS 'Локации внутри кейса';
COMMENT ON COLUMN public.locations.case_id IS 'Кейс, которому принадлежит локация';
COMMENT ON COLUMN public.locations.parent_id IS 'Родительская локация (для вложенности)';
COMMENT ON COLUMN public.locations.name IS 'Название: «Гостиная», «Улица Ленина»';
COMMENT ON COLUMN public.locations.description IS 'Описание локации';
COMMENT ON COLUMN public.locations.location_type IS 'Тип: HOUSE, ROOM, STREET, FOREST, VEHICLE, DIGITAL, BUILDING, OTHER';
COMMENT ON COLUMN public.locations.sort_order IS 'Порядок отображения внутри родителя';
COMMENT ON COLUMN public.locations.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.locations.updated_at IS 'UTC, обновляется при изменении';
COMMENT ON COLUMN public.locations.media_id IS 'Фон локации (PNG, JPG)';
COMMENT ON COLUMN public.locations.entry_x IS 'X точки входа игрока (0-100%%)';
COMMENT ON COLUMN public.locations.entry_y IS 'Y точки входа игрока (0-100%%)';
COMMENT ON COLUMN public.locations.discovery_mode IS 'Как открывается локация: ALWAYS | ON_EVIDENCE | ON_DIALOG | ON_LOCATION | ON_MANUAL';
COMMENT ON COLUMN public.locations.discovery_target_id IS 'UUID цели-триггера (улики/персонажа/локации). NULL для ALWAYS/ON_MANUAL.';
COMMENT ON COLUMN public.locations.discovery_hint IS 'Текст-подсказка в момент открытия: «Вы узнали адрес садика».';
COMMENT ON COLUMN public.locations.map_x IS 'X карточки на карте дела (px)';
COMMENT ON COLUMN public.locations.map_y IS 'Y карточки на карте дела (px)';
COMMENT ON COLUMN public.locations.scene_scale IS 'Множитель размера под-локации (0.1–10.0)';
COMMENT ON COLUMN public.locations.scene_rotation IS 'Угол поворота, градусы (-180–180)';
COMMENT ON COLUMN public.locations.preview_media_id IS 'Превью локации для карты дела. Отдельно от media_id (фон сцены).';
COMMENT ON COLUMN public.locations.map_media_id IS 'PNG-спрайт локации для карты дела. Отдельно от media_id (фон сцены) и preview_media_id (большое превью).';

CREATE TABLE public.player_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    player_id uuid NOT NULL,
    evidence_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.player_inventory IS 'Личный инвентарь игрока: улики, которые он взял';
COMMENT ON COLUMN public.player_inventory.player_id IS 'Игрок, у которого улика в сумке';

CREATE TABLE public.roles (
    id smallint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL
);
COMMENT ON TABLE public.roles IS 'Роли пользователей';
COMMENT ON COLUMN public.roles.code IS 'Машиночитаемый идентификатор: USER, ADMIN, AUTHOR, TESTER';

CREATE TABLE public.session_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    player_id uuid NOT NULL,
    action_type character varying(30) NOT NULL,
    target_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sa_action_check CHECK (((action_type)::text = ANY (ARRAY[('OBJECT_INTERACTED'::character varying)::text, ('LOCATION_VISITED'::character varying)::text, ('EVIDENCE_DISCOVERED'::character varying)::text, ('PUZZLE_SOLVED'::character varying)::text])))
);
COMMENT ON TABLE public.session_actions IS 'Журнал действий игроков в сессии';
COMMENT ON COLUMN public.session_actions.session_id IS 'Сессия';
COMMENT ON COLUMN public.session_actions.player_id IS 'Игрок, совершивший действие';
COMMENT ON COLUMN public.session_actions.action_type IS 'Тип действия';
COMMENT ON COLUMN public.session_actions.target_id IS 'UUID объекта/локации/улики, к чему действие';

CREATE TABLE public.session_discovered_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    evidence_id uuid NOT NULL,
    discovered_by uuid NOT NULL,
    discovered_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.session_discovered_evidence IS 'Улики, найденные командой в сессии';
COMMENT ON COLUMN public.session_discovered_evidence.discovered_by IS 'Игрок, который нашёл первым';

CREATE TABLE public.session_final_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option_id text NOT NULL,
    submitted_by uuid NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    is_correct boolean NOT NULL
);
COMMENT ON TABLE public.session_final_answers IS 'Ответы команд на финальный вопрос';
COMMENT ON COLUMN public.session_final_answers.selected_option_id IS 'Выбранный вариант ИЛИ свободный текстовый ответ команды';

CREATE TABLE public.session_players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid,
    guest_token uuid,
    display_name character varying(50) NOT NULL,
    avatar_key character varying(50) DEFAULT 'default'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    pos_x real DEFAULT 50 NOT NULL,
    pos_y real DEFAULT 50 NOT NULL,
    facing character varying(10) DEFAULT 'DOWN'::character varying NOT NULL,
    is_ready boolean DEFAULT false NOT NULL,
    current_location_id uuid,
    CONSTRAINT sp_user_or_guest CHECK ((((user_id IS NOT NULL) AND (guest_token IS NULL)) OR ((user_id IS NULL) AND (guest_token IS NOT NULL))))
);
COMMENT ON TABLE public.session_players IS 'Игроки в сессии';
COMMENT ON COLUMN public.session_players.user_id IS 'UUID зарегистрированного пользователя (если есть)';
COMMENT ON COLUMN public.session_players.guest_token IS 'UUID гостя без регистрации';
COMMENT ON COLUMN public.session_players.display_name IS 'Имя в комнате (у гостя — введённое)';
COMMENT ON COLUMN public.session_players.avatar_key IS 'Ключ аватара';
COMMENT ON COLUMN public.session_players.is_active IS 'Активен ли в сессии';
COMMENT ON COLUMN public.session_players.pos_x IS 'Позиция X в комнате (0-100)';
COMMENT ON COLUMN public.session_players.pos_y IS 'Позиция Y в комнате (0-100)';
COMMENT ON COLUMN public.session_players.facing IS 'Направление: UP, DOWN, LEFT, RIGHT';
COMMENT ON COLUMN public.session_players.is_ready IS 'Готовность игрока к старту';
COMMENT ON COLUMN public.session_players.current_location_id IS 'UUID локации, где игрок сейчас. NULL — на карте дела.';

CREATE TABLE public.session_unlocked_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    location_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    unlocked_by uuid
);
COMMENT ON TABLE public.session_unlocked_locations IS 'Локации, открытые в конкретной сессии (dynamic unlock).';

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id smallint NOT NULL
);
COMMENT ON TABLE public.user_roles IS 'Связь пользователей и ролей (M2M)';

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(50) NOT NULL,
    avatar_key character varying(50) DEFAULT 'default'::character varying NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('BLOCKED'::character varying)::text, ('DELETED'::character varying)::text])))
);
COMMENT ON TABLE public.users IS 'Пользователи платформы';
COMMENT ON COLUMN public.users.email IS 'Email, используется как логин';
COMMENT ON COLUMN public.users.password_hash IS 'BCrypt-хеш пароля. Никогда не хранить пароль в открытом виде';
COMMENT ON COLUMN public.users.display_name IS 'Отображаемое имя в комнатах';
COMMENT ON COLUMN public.users.avatar_key IS 'Ключ предустановленного аватара';
COMMENT ON COLUMN public.users.status IS 'ACTIVE | BLOCKED | DELETED';
COMMENT ON COLUMN public.users.created_at IS 'UTC, проставляется БД';
COMMENT ON COLUMN public.users.last_login_at IS 'UTC, обновляется при успешном логине';

-- ============================================================
-- PRIMARY KEY И UNIQUE CONSTRAINTS
-- ============================================================

ALTER TABLE ONLY public.board_connections ADD CONSTRAINT bc_unique UNIQUE (session_id, from_item_id, to_item_id);
ALTER TABLE ONLY public.board_connections ADD CONSTRAINT board_connections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.board_items ADD CONSTRAINT board_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.case_media ADD CONSTRAINT case_media_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_code_unique UNIQUE (code);
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.character_dialogs ADD CONSTRAINT character_dialogs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.characters ADD CONSTRAINT characters_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.case_media ADD CONSTRAINT cm_s3_key_unique UNIQUE (s3_key);
ALTER TABLE ONLY public.evidences ADD CONSTRAINT evidences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.figures ADD CONSTRAINT figures_code_key UNIQUE (code);
ALTER TABLE ONLY public.figures ADD CONSTRAINT figures_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.final_questions ADD CONSTRAINT final_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.final_questions ADD CONSTRAINT fq_case_unique UNIQUE (case_id);
ALTER TABLE ONLY public.game_conditions ADD CONSTRAINT game_conditions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.game_events ADD CONSTRAINT game_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.game_objects ADD CONSTRAINT game_objects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.game_sessions ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.game_sessions ADD CONSTRAINT gs_room_code_unique UNIQUE (room_code);
ALTER TABLE ONLY public.location_connections ADD CONSTRAINT lc_unique UNIQUE (case_id, from_location_id, to_location_id);
ALTER TABLE ONLY public.location_connections ADD CONSTRAINT location_connections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.player_inventory ADD CONSTRAINT pi_unique UNIQUE (session_id, player_id, evidence_id);
ALTER TABLE ONLY public.player_inventory ADD CONSTRAINT player_inventory_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_code_key UNIQUE (code);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_discovered_evidence ADD CONSTRAINT sde_unique UNIQUE (session_id, evidence_id);
ALTER TABLE ONLY public.session_actions ADD CONSTRAINT session_actions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_discovered_evidence ADD CONSTRAINT session_discovered_evidence_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_final_answers ADD CONSTRAINT session_final_answers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_players ADD CONSTRAINT session_players_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_unlocked_locations ADD CONSTRAINT session_unlocked_locations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_final_answers ADD CONSTRAINT sfa_unique UNIQUE (session_id, question_id);
ALTER TABLE ONLY public.session_players ADD CONSTRAINT sp_unique_guest UNIQUE (session_id, guest_token);
ALTER TABLE ONLY public.session_players ADD CONSTRAINT sp_unique_user UNIQUE (session_id, user_id);
ALTER TABLE ONLY public.session_unlocked_locations ADD CONSTRAINT sul_unique UNIQUE (session_id, location_id);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ============================================================
-- ИНДЕКСЫ
-- ============================================================

CREATE INDEX idx_bc_session ON public.board_connections USING btree (session_id);
CREATE INDEX idx_bi_evidence ON public.board_items USING btree (evidence_id);
CREATE INDEX idx_bi_session ON public.board_items USING btree (session_id);
CREATE INDEX idx_cases_created_by ON public.cases USING btree (created_by);
CREATE INDEX idx_cases_genre ON public.cases USING btree (genre);
CREATE INDEX idx_cases_status ON public.cases USING btree (status);
CREATE INDEX idx_characters_case ON public.characters USING btree (case_id);
CREATE INDEX idx_characters_dialogue_media ON public.characters USING btree (dialogue_media_id);
CREATE INDEX idx_characters_location ON public.characters USING btree (location_id);
CREATE INDEX idx_cm_case ON public.case_media USING btree (case_id);
CREATE INDEX idx_cm_uploader ON public.case_media USING btree (uploaded_by);
CREATE INDEX idx_dialogs_character ON public.character_dialogs USING btree (character_id);
CREATE INDEX idx_evidences_case ON public.evidences USING btree (case_id);
CREATE INDEX idx_evidences_location ON public.evidences USING btree (location_id);
CREATE INDEX idx_evidences_media ON public.evidences USING btree (media_id);
CREATE INDEX idx_evidences_object ON public.evidences USING btree (object_id);
CREATE INDEX idx_figures_active ON public.figures USING btree (active, sort_order, created_at);
CREATE INDEX idx_game_objects_location ON public.game_objects USING btree (location_id);
CREATE INDEX idx_game_objects_location_sort ON public.game_objects USING btree (location_id, sort_order);
CREATE INDEX idx_game_objects_media ON public.game_objects USING btree (media_id);
CREATE INDEX idx_gc_case ON public.game_conditions USING btree (case_id);
CREATE INDEX idx_gc_type_target ON public.game_conditions USING btree (condition_type, target_id);
CREATE INDEX idx_ge_case ON public.game_events USING btree (case_id);
CREATE INDEX idx_ge_condition ON public.game_events USING btree (condition_id);
CREATE INDEX idx_gs_case ON public.game_sessions USING btree (case_id);
CREATE INDEX idx_gs_owner ON public.game_sessions USING btree (owner_user_id);
CREATE INDEX idx_gs_room_code ON public.game_sessions USING btree (room_code);
CREATE INDEX idx_gs_status ON public.game_sessions USING btree (status);
CREATE INDEX idx_lc_case ON public.location_connections USING btree (case_id);
CREATE INDEX idx_lc_from ON public.location_connections USING btree (from_location_id);
CREATE INDEX idx_lc_to ON public.location_connections USING btree (to_location_id);
CREATE INDEX idx_locations_case ON public.locations USING btree (case_id);
CREATE INDEX idx_locations_case_type ON public.locations USING btree (case_id, location_type);
CREATE INDEX idx_locations_map_media ON public.locations USING btree (map_media_id);
CREATE INDEX idx_locations_media ON public.locations USING btree (media_id);
CREATE INDEX idx_locations_parent ON public.locations USING btree (parent_id);
CREATE INDEX idx_locations_preview_media ON public.locations USING btree (preview_media_id);
CREATE INDEX idx_pi_player ON public.player_inventory USING btree (player_id);
CREATE INDEX idx_pi_session ON public.player_inventory USING btree (session_id);
CREATE INDEX idx_sa_session ON public.session_actions USING btree (session_id);
CREATE INDEX idx_sa_session_action ON public.session_actions USING btree (session_id, action_type);
CREATE INDEX idx_sa_session_action_target ON public.session_actions USING btree (session_id, action_type, target_id);
CREATE INDEX idx_sde_evidence ON public.session_discovered_evidence USING btree (evidence_id);
CREATE INDEX idx_sde_session ON public.session_discovered_evidence USING btree (session_id);
CREATE INDEX idx_sfa_session ON public.session_final_answers USING btree (session_id);
CREATE INDEX idx_sp_current_location ON public.session_players USING btree (current_location_id);
CREATE INDEX idx_sp_session ON public.session_players USING btree (session_id);
CREATE INDEX idx_sp_user ON public.session_players USING btree (user_id);
CREATE INDEX idx_sul_session ON public.session_unlocked_locations USING btree (session_id);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role_id);
CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);
CREATE INDEX idx_users_status ON public.users USING btree (status);

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

ALTER TABLE ONLY public.board_connections ADD CONSTRAINT bc_from_fk FOREIGN KEY (from_item_id) REFERENCES public.board_items(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_connections ADD CONSTRAINT bc_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_connections ADD CONSTRAINT bc_to_fk FOREIGN KEY (to_item_id) REFERENCES public.board_items(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_items ADD CONSTRAINT bi_evidence_fk FOREIGN KEY (evidence_id) REFERENCES public.evidences(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.board_items ADD CONSTRAINT bi_player_fk FOREIGN KEY (created_by) REFERENCES public.session_players(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_items ADD CONSTRAINT bi_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_cover_media_fk FOREIGN KEY (cover_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_created_by_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_entry_location_fk FOREIGN KEY (entry_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.cases ADD CONSTRAINT cases_map_media_fk FOREIGN KEY (map_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.character_dialogs ADD CONSTRAINT cd_character_fk FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.character_dialogs ADD CONSTRAINT cd_evidence_fk FOREIGN KEY (requires_evidence_id) REFERENCES public.evidences(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.characters ADD CONSTRAINT ch_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.characters ADD CONSTRAINT ch_location_fk FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.characters ADD CONSTRAINT ch_portrait_fk FOREIGN KEY (portrait_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.characters ADD CONSTRAINT characters_dialogue_media_fk FOREIGN KEY (dialogue_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.case_media ADD CONSTRAINT cm_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.case_media ADD CONSTRAINT cm_user_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.evidences ADD CONSTRAINT evidences_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evidences ADD CONSTRAINT evidences_location_fk FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.evidences ADD CONSTRAINT evidences_media_fk FOREIGN KEY (media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.evidences ADD CONSTRAINT evidences_object_fk FOREIGN KEY (object_id) REFERENCES public.game_objects(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.figures ADD CONSTRAINT figures_media_fk FOREIGN KEY (media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.final_questions ADD CONSTRAINT fq_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_objects ADD CONSTRAINT game_objects_location_fk FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_objects ADD CONSTRAINT game_objects_media_fk FOREIGN KEY (media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.game_conditions ADD CONSTRAINT gc_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_events ADD CONSTRAINT ge_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_events ADD CONSTRAINT ge_condition_fk FOREIGN KEY (condition_id) REFERENCES public.game_conditions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_sessions ADD CONSTRAINT gs_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.game_sessions ADD CONSTRAINT gs_owner_fk FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.location_connections ADD CONSTRAINT lc_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.location_connections ADD CONSTRAINT lc_from_fk FOREIGN KEY (from_location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.location_connections ADD CONSTRAINT lc_to_fk FOREIGN KEY (to_location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_map_media_fk FOREIGN KEY (map_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_media_fk FOREIGN KEY (media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_parent_fk FOREIGN KEY (parent_id) REFERENCES public.locations(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.locations ADD CONSTRAINT locations_preview_media_fk FOREIGN KEY (preview_media_id) REFERENCES public.case_media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.player_inventory ADD CONSTRAINT pi_evidence_fk FOREIGN KEY (evidence_id) REFERENCES public.evidences(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.player_inventory ADD CONSTRAINT pi_player_fk FOREIGN KEY (player_id) REFERENCES public.session_players(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.player_inventory ADD CONSTRAINT pi_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_actions ADD CONSTRAINT sa_player_fk FOREIGN KEY (player_id) REFERENCES public.session_players(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_actions ADD CONSTRAINT sa_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_discovered_evidence ADD CONSTRAINT sde_evidence_fk FOREIGN KEY (evidence_id) REFERENCES public.evidences(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_discovered_evidence ADD CONSTRAINT sde_player_fk FOREIGN KEY (discovered_by) REFERENCES public.session_players(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_discovered_evidence ADD CONSTRAINT sde_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_final_answers ADD CONSTRAINT sfa_question_fk FOREIGN KEY (question_id) REFERENCES public.final_questions(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.session_final_answers ADD CONSTRAINT sfa_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_players ADD CONSTRAINT sp_current_location_fk FOREIGN KEY (current_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.session_players ADD CONSTRAINT sp_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_players ADD CONSTRAINT sp_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.session_unlocked_locations ADD CONSTRAINT sul_location_fk FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_unlocked_locations ADD CONSTRAINT sul_session_fk FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT ur_role_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT ur_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;