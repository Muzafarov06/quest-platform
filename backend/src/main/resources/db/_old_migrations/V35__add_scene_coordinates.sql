-- =====================================================================
-- V35: Координаты для визуального редактора сцен.
--
-- Всё в процентах (0-100) относительно размеров сцены:
--   locations.entry_x / entry_y      — где появляется игрок, войдя в локацию
--   game_objects.pos_x / pos_y       — где объект стоит на сцене
--   location_connections.pos_x/pos_y — где зона перехода (NULL = не показывать)
--
-- У game_objects DEFAULT 50/50: старые объекты окажутся в центре — их
-- надо будет разложить через новый редактор. Не теряем данные, но
-- видно, что не настроено.
--
-- location_connections.pos_x/pos_y nullable — существующие переходы
-- остаются в виде списка (например, «Вернуться в штаб»).
-- =====================================================================

ALTER TABLE locations
    ADD COLUMN entry_x REAL NOT NULL DEFAULT 50,
    ADD COLUMN entry_y REAL NOT NULL DEFAULT 85;

COMMENT ON COLUMN locations.entry_x IS 'X точки входа игрока (0-100%%)';
COMMENT ON COLUMN locations.entry_y IS 'Y точки входа игрока (0-100%%)';

ALTER TABLE game_objects
    ADD COLUMN pos_x REAL NOT NULL DEFAULT 50,
    ADD COLUMN pos_y REAL NOT NULL DEFAULT 50;

COMMENT ON COLUMN game_objects.pos_x IS 'X объекта на сцене локации (0-100%%)';
COMMENT ON COLUMN game_objects.pos_y IS 'Y объекта на сцене локации (0-100%%)';

ALTER TABLE location_connections
    ADD COLUMN pos_x REAL,
    ADD COLUMN pos_y REAL;

COMMENT ON COLUMN location_connections.pos_x IS
    'X зоны перехода на сцене (0-100%%), NULL = показать списком';
COMMENT ON COLUMN location_connections.pos_y IS
    'Y зоны перехода на сцене (0-100%%), NULL = показать списком';